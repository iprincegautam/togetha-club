package club.togetha.app.nav

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.Forum
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.PhotoLibrary
import androidx.compose.material.icons.outlined.Route
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import club.togetha.app.Prefs
import club.togetha.app.core.analytics.EngagementTracker
import club.togetha.app.core.state.AppState
import club.togetha.app.feature.account.AccountScreen
import club.togetha.app.feature.account.KycScreen
import club.togetha.app.feature.account.QueriesScreen
import club.togetha.app.feature.account.QuizProfileScreen
import club.togetha.app.feature.account.VerificationScreen
import club.togetha.app.feature.auth.AuthScreen
import club.togetha.app.feature.apply.ApplyFlowScreen
import club.togetha.app.feature.batchdetail.BatchDetailScreen
import club.togetha.app.feature.community.GroupChatScreen
import club.togetha.app.feature.community.GroupsScreen
import club.togetha.app.feature.discover.DiscoverScreen
import club.togetha.app.feature.feed.FeedScreen
import club.togetha.app.feature.journey.JourneyScreen
import club.togetha.app.feature.onboarding.OnboardingScreen
import club.togetha.app.feature.quiz.QuizScreen
import club.togetha.app.feature.site.AboutScreen
import club.togetha.app.feature.site.HowItWorksScreen
import club.togetha.app.feature.site.ItinerariesScreen
import club.togetha.app.feature.site.JournalScreen
import club.togetha.app.feature.site.SafetyScreen
import club.togetha.app.feature.splash.SplashScreen
import club.togetha.app.feature.tia.TiaChatScreen
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Ink
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

object Routes {
    const val SPLASH = "splash"
    const val ONBOARDING = "onboarding"
    const val DISCOVER = "discover"
    const val FEED = "feed"
    const val CHAT = "chat"
    const val JOURNEY = "journey"
    const val ACCOUNT = "account"
    const val AUTH = "auth"
    const val BATCH_DETAIL = "batch/{batchId}"
    const val QUIZ = "quiz/{mode}"
    const val QUIZ_PROFILE = "quiz_profile"
    const val VERIFICATION = "verification"
    const val APPLY = "apply/{batchId}"
    const val TIA = "tia"
    const val GROUP_CHAT = "group/{groupId}"
    const val QUERIES = "queries"
    const val KYC = "kyc"
    const val HOW_IT_WORKS = "how_it_works"
    const val SAFETY = "safety"
    const val ITINERARIES = "itineraries/{trip}"
    const val JOURNAL = "journal"
    const val ABOUT = "about"
    fun itineraries(trip: String = "himalayan") = "itineraries/$trip"
    fun quiz(mode: String = "edit") = "quiz/$mode"
    fun batchDetail(id: String) = "batch/$id"
    fun apply(id: String) = "apply/$id"
    fun groupChat(id: String) = "group/$id"
}

private data class Tab(val route: String, val label: String, val icon: ImageVector)

private val tabs = listOf(
    Tab(Routes.DISCOVER, "Discover", Icons.Outlined.Explore),
    Tab(Routes.FEED, "Feed", Icons.Outlined.PhotoLibrary),
    Tab(Routes.CHAT, "Chat", Icons.Outlined.Forum),
    Tab(Routes.JOURNEY, "Journey", Icons.Outlined.Route),
    Tab(Routes.ACCOUNT, "Account", Icons.Outlined.Person),
)

private val tabRoutes = tabs.map { it.route }.toSet()

@Composable
fun TogethaRoot() {
    val context = LocalContext.current
    val navController = rememberNavController()
    val scope = rememberCoroutineScope()
    var postSplash by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        EngagementTracker.init(context)
        AppState.load(context)
        postSplash = when {
            !Prefs.onboardingDone(context).first() -> Routes.ONBOARDING
            !Prefs.signedIn(context) -> Routes.AUTH
            !AppState.quizCompleted -> Routes.quiz("onboarding")
            else -> Routes.DISCOVER
        }
    }

    val backStack by navController.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route
    val showChrome = currentRoute in tabRoutes

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            if (showChrome) {
                NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                    tabs.forEach { tab ->
                        NavigationBarItem(
                            selected = currentRoute == tab.route,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { Text(tab.label) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = MaterialTheme.colorScheme.primary,
                                indicatorColor = MaterialTheme.colorScheme.secondaryContainer,
                            ),
                        )
                    }
                }
            }
        },
        floatingActionButton = {
            if (showChrome) {
                FloatingActionButton(
                    onClick = { navController.navigate(Routes.TIA) },
                    containerColor = Amber,
                    contentColor = Ink,
                ) {
                    Icon(Icons.Filled.AutoAwesome, contentDescription = "Chat with Tia")
                }
            }
        },
    ) { padding ->
        val springDurationIn = 380
        val tabEnter = fadeIn(tween(springDurationIn)) + slideInVertically(tween(springDurationIn)) { it / 24 }
        val tabExit = fadeOut(tween(180))
        val pushEnter = slideInHorizontally(tween(springDurationIn)) { it / 3 } + fadeIn(tween(springDurationIn)) +
            scaleIn(initialScale = 0.94f, animationSpec = tween(springDurationIn))
        val pushExit = fadeOut(tween(200)) + scaleOut(targetScale = 0.98f, animationSpec = tween(200))
        val popEnter = fadeIn(tween(springDurationIn)) + scaleIn(initialScale = 1.02f, animationSpec = tween(springDurationIn))
        val popExit = slideOutHorizontally(tween(260)) { it / 3 } + fadeOut(tween(260))

        NavHost(
            navController = navController,
            startDestination = Routes.SPLASH,
            modifier = Modifier.padding(padding),
            enterTransition = {
                if (targetState.destination.route in tabRoutes && initialState.destination.route in tabRoutes) tabEnter
                else pushEnter
            },
            exitTransition = {
                if (targetState.destination.route in tabRoutes && initialState.destination.route in tabRoutes) tabExit
                else pushExit
            },
            popEnterTransition = { popEnter },
            popExitTransition = { popExit },
        ) {
            composable(
                Routes.SPLASH,
                enterTransition = { EnterTransition.None },
                exitTransition = { fadeOut(tween(450)) },
            ) {
                var splashDone by remember { mutableStateOf(false) }
                SplashScreen(onFinished = { splashDone = true })
                val next = postSplash
                LaunchedEffect(splashDone, next) {
                    if (splashDone && next != null) {
                        navController.navigate(next) {
                            popUpTo(Routes.SPLASH) { inclusive = true }
                        }
                    }
                }
            }
            composable(Routes.ONBOARDING) {
                OnboardingScreen(onDone = {
                    scope.launch { Prefs.setOnboardingDone(context) }
                    navController.navigate(Routes.AUTH) {
                        popUpTo(Routes.ONBOARDING) { inclusive = true }
                    }
                })
            }
            composable(Routes.AUTH) {
                AuthScreen(onDone = {
                    scope.launch { AppState.setSignedIn(context, true) }
                    val next = if (AppState.quizCompleted) Routes.DISCOVER else Routes.quiz("onboarding")
                    navController.navigate(next) {
                        popUpTo(Routes.AUTH) { inclusive = true }
                    }
                })
            }
            composable(Routes.DISCOVER) {
                DiscoverScreen(
                    onBatchClick = { navController.navigate(Routes.batchDetail(it)) },
                    onTakeQuiz = { navController.navigate(Routes.quiz("edit")) },
                    onExplore = { route -> navController.navigate(route) },
                )
            }
            composable(Routes.HOW_IT_WORKS) {
                HowItWorksScreen(
                    onBack = { navController.popBackStack() },
                    onSeeBatches = { navController.popBackStack(Routes.DISCOVER, inclusive = false) },
                )
            }
            composable(Routes.SAFETY) { SafetyScreen(onBack = { navController.popBackStack() }) }
            composable(Routes.ITINERARIES) { entry ->
                val trip = entry.arguments?.getString("trip") ?: "himalayan"
                ItinerariesScreen(onBack = { navController.popBackStack() }, initialTrip = trip)
            }
            composable(Routes.JOURNAL) { JournalScreen(onBack = { navController.popBackStack() }) }
            composable(Routes.ABOUT) { AboutScreen(onBack = { navController.popBackStack() }) }
            composable(Routes.FEED) { FeedScreen() }
            composable(Routes.CHAT) {
                GroupsScreen(onGroupClick = { navController.navigate(Routes.groupChat(it)) })
            }
            composable(Routes.JOURNEY) { JourneyScreen() }
            composable(Routes.ACCOUNT) {
                AccountScreen(
                    onQueries = { navController.navigate(Routes.QUERIES) },
                    onKyc = { navController.navigate(Routes.KYC) },
                    onQuizProfile = { navController.navigate(Routes.QUIZ_PROFILE) },
                    onVerification = { navController.navigate(Routes.VERIFICATION) },
                    onLogin = { navController.navigate(Routes.AUTH) },
                )
            }
            composable(Routes.BATCH_DETAIL) { entry ->
                val id = entry.arguments?.getString("batchId").orEmpty()
                BatchDetailScreen(
                    batchId = id,
                    onBack = { navController.popBackStack() },
                    onApply = { navController.navigate(Routes.apply(id)) },
                    onItinerary = { trip -> navController.navigate(Routes.itineraries(trip)) },
                )
            }
            composable(Routes.QUIZ) { entry ->
                val mode = entry.arguments?.getString("mode") ?: "edit"
                val onboarding = mode == "onboarding"
                fun toTabs() {
                    navController.navigate(Routes.DISCOVER) {
                        popUpTo(Routes.QUIZ) { inclusive = true }
                    }
                }
                QuizScreen(
                    mode = mode,
                    onBack = { if (!onboarding) navController.popBackStack() },
                    onApply = { batchId ->
                        if (onboarding) toTabs()
                        navController.navigate(Routes.apply(batchId))
                    },
                    onDone = { if (onboarding) toTabs() else navController.popBackStack() },
                )
            }
            composable(Routes.QUIZ_PROFILE) {
                QuizProfileScreen(
                    onBack = { navController.popBackStack() },
                    onEditQuiz = { navController.navigate(Routes.quiz("edit")) },
                )
            }
            composable(Routes.VERIFICATION) {
                VerificationScreen(onBack = { navController.popBackStack() })
            }
            composable(Routes.APPLY) { entry ->
                val id = entry.arguments?.getString("batchId").orEmpty()
                ApplyFlowScreen(
                    batchId = id,
                    onBack = { navController.popBackStack() },
                    onGoToJourney = {
                        navController.navigate(Routes.JOURNEY) {
                            popUpTo(Routes.DISCOVER)
                        }
                    },
                )
            }
            composable(Routes.TIA) {
                TiaChatScreen(onBack = { navController.popBackStack() })
            }
            composable(Routes.GROUP_CHAT) { entry ->
                val id = entry.arguments?.getString("groupId").orEmpty()
                GroupChatScreen(groupId = id, onBack = { navController.popBackStack() })
            }
            composable(Routes.QUERIES) { QueriesScreen(onBack = { navController.popBackStack() }) }
            composable(Routes.KYC) { KycScreen(onBack = { navController.popBackStack() }) }
        }
    }
}
