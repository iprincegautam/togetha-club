plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}

android {
    namespace = "club.togetha.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "club.togetha.app"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
        buildConfigField("String", "API_BASE_URL", "\"\"")
        buildConfigField("String", "TIA_BASE_URL", "\"\"")
        // Shared PRODUCTION Supabase project (same as togetha.club). The anon key is a
        // public client credential by design — RLS protects the data. Never put the
        // service role key (or any other secret) here.
        val supabaseUrl = "https://bqroebrlhndftkutsqbu.supabase.co"
        buildConfigField("String", "SUPABASE_URL", "\"$supabaseUrl\"")
        buildConfigField(
            "String",
            "SUPABASE_ANON_KEY",
            "\"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcm9lYnJsaG5kZnRrdXRzcWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNTY5NDQsImV4cCI6MjA5NTkzMjk0NH0.EBOlis17YB0dFskbxsT07IqwN8A48h1Giy9tvpaf6UY\"",
        )
        buildConfigField("String", "FUNCTIONS_URL", "\"$supabaseUrl/functions/v1\"")
        // Razorpay TEST key id (public client value). Checkout stays mocked until the
        // order-creation edge function (which holds the secret) ships.
        buildConfigField("String", "RAZORPAY_KEY_ID", "\"rzp_test_Sx8itYGa44f0Zv\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            // Unsigned release for now — sign via Play App Signing / a signingConfig before store upload.
        }
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.12.01")
    implementation(composeBom)
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.navigation:navigation-compose:2.8.5")
    implementation("androidx.datastore:datastore-preferences:1.1.1")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("io.coil-kt:coil-compose:2.7.0")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit")
}
