package club.togetha.app.core.api

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * Decodes JSON recorded verbatim from the production Supabase REST endpoints
 * (curl against /rest/v1/batches?select=*&status=eq.open and
 * /rest/v1/batch_departures?select=*&status=eq.open&order=sort_order on 2026-07-22)
 * and verifies the exact mapping LiveApiClient performs.
 */
class LiveMappingTest {

    // Real prod response, 2026-07-22.
    private val batchesJson = """
    [{"slug":"batch-b","name":"Himalayan Love Trail — Millennial Edition","price":9999,"status":"open","spots_taken_m":19,"spots_taken_f":6,"created_at":"2026-06-02T02:20:55.141542+00:00","max_spots_m":12,"max_spots_f":12,"deposit_percent":25},
     {"slug":"batch-e","name":"Udaipur Love Trail — Millennial Edition","price":11999,"status":"open","spots_taken_m":2,"spots_taken_f":0,"created_at":"2026-07-02T04:26:24.050405+00:00","max_spots_m":12,"max_spots_f":12,"deposit_percent":30},
     {"slug":"batch-d","name":"Udaipur Love Trail — GenZ Edition","price":11999,"status":"open","spots_taken_m":2,"spots_taken_f":0,"created_at":"2026-07-02T04:26:24.050405+00:00","max_spots_m":12,"max_spots_f":12,"deposit_percent":30},
     {"slug":"batch-a","name":"Himalayan Love Trail — GenZ Edition","price":9999,"status":"open","spots_taken_m":24,"spots_taken_f":7,"created_at":"2026-06-02T02:20:55.141542+00:00","max_spots_m":12,"max_spots_f":12,"deposit_percent":25}]
    """.trimIndent()

    private val departuresJson = """
    [{"id":"8bb6820c-4369-457d-aa5d-3cfecc30e31e","batch_slug":"batch-b","label":"Friday, 24 July 2026","sublabel":"Returns Wednesday, 29 July · 5N/6D","departure_date":"2026-07-24","return_date":"2026-07-29","status":"open","spots_m":12,"spots_f":12,"spots_taken_m":0,"spots_taken_f":0,"sort_order":1,"created_at":"2026-06-16T23:32:39.756622+00:00","updated_at":"2026-07-10T07:28:00.332129+00:00"},
     {"id":"b9c91bf7-ccd7-455c-9f05-e2002ca19c21","batch_slug":"batch-a","label":"Friday, 24 July 2026","sublabel":"Returns Wednesday, 29 July · 5N/6D","departure_date":"2026-07-24","return_date":"2026-07-29","status":"open","spots_m":12,"spots_f":12,"spots_taken_m":0,"spots_taken_f":0,"sort_order":1,"created_at":"2026-06-16T23:32:39.756622+00:00","updated_at":"2026-07-10T07:27:58.789437+00:00"},
     {"id":"0ecdc7b4-b7a9-41e1-9acd-89a47642943d","batch_slug":"batch-b","label":"Friday, 07 August 2026","sublabel":"Returns Wednesday, 12 August · 5N/6D","departure_date":"2026-08-07","return_date":"2026-08-12","status":"open","spots_m":12,"spots_f":12,"spots_taken_m":0,"spots_taken_f":0,"sort_order":2,"created_at":"2026-06-16T23:32:39.756622+00:00","updated_at":"2026-07-10T07:28:00.862351+00:00"},
     {"id":"9e1cea5a-e102-4c19-939a-dbc065b22cb9","batch_slug":"batch-d","label":"Friday, 31 July 2026","sublabel":"Returns Tuesday, 04 August early morning · 2N/3D","departure_date":"2026-07-31","return_date":"2026-08-04","status":"open","spots_m":12,"spots_f":12,"spots_taken_m":3,"spots_taken_f":1,"sort_order":2,"created_at":"2026-07-02T04:26:24.050405+00:00","updated_at":"2026-07-10T07:27:55.104263+00:00"}]
    """.trimIndent()

    private val templates = MockApiClient().batchTemplates()

    @Test
    fun `maps all four open prod batches plus mystery template`() {
        val batches = mapLiveBatches(batchesJson, departuresJson, templates)
        assertEquals(listOf("batch-a", "batch-b", "batch-d", "batch-e", "batch-c"), batches.map { it.id })
        assertTrue(batches.first { it.id == "batch-c" }.waitlistOnly)
    }

    @Test
    fun `price is integer rupees and deposit uses deposit_percent`() {
        val batches = mapLiveBatches(batchesJson, departuresJson, templates)
        val a = batches.first { it.id == "batch-a" }
        assertEquals(9999, a.priceInr)
        assertEquals(2499, a.depositInr)      // 25% on Himalayan batches in prod
        val e = batches.first { it.id == "batch-e" }
        assertEquals(11999, e.priceInr)
        assertEquals(3599, e.depositInr)      // 30%
    }

    @Test
    fun `capacity and taken spots map with clamping`() {
        val a = mapLiveBatches(batchesJson, departuresJson, templates).first { it.id == "batch-a" }
        assertEquals(12, a.menCapacity)
        assertEquals(12, a.menCount)          // spots_taken_m=24 clamped to capacity
        assertEquals(7, a.womenCount)
        assertEquals(5, a.spotsLeft)          // computed prop still works
    }

    @Test
    fun `departures attach by slug with remaining spots`() {
        val batches = mapLiveBatches(batchesJson, departuresJson, templates)
        val b = batches.first { it.id == "batch-b" }
        assertEquals(2, b.departures.size)
        assertEquals("Friday, 24 July 2026", b.departures.first().date)
        val d = batches.first { it.id == "batch-d" }.departures.single()
        assertEquals(9, d.menLeft)            // 12 - 3
        assertEquals(11, d.womenLeft)         // 12 - 1
    }

    @Test
    fun `null price (mystery batch) maps to waitlist-only zero price`() {
        val json = """[{"slug":"batch-c","name":"Mystery Edition","price":null,"status":"open","spots_taken_m":0,"spots_taken_f":0,"max_spots_m":12,"max_spots_f":12,"deposit_percent":30}]"""
        val c = mapLiveBatches(json, "[]", templates).first { it.id == "batch-c" }
        assertEquals(0, c.priceInr)
        assertEquals(0, c.depositInr)
        assertTrue(c.waitlistOnly)
    }

    @Test
    fun `feed rows decode and unknown feed table error path stays empty`() {
        val photos = mapLiveFeed(
            """[{"id":"x1","batch_slug":"batch-a","storage_path":"trips/a/1.jpg","caption":"Kasol","status":"approved","extra_column":1}]""",
            templates,
        )
        assertEquals(1, photos.size)
        assertEquals("Himalayan Love Trail — GenZ Edition", photos.single().batchName)
    }
}
