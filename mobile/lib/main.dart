import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'screens/dashboard_screen.dart';
import 'screens/review_screen.dart';
import 'screens/wine_form_screen.dart';

void main() {
  runApp(const WineCellarApp());
}

final _router = GoRouter(
  routes: [
    GoRoute(path: '/', builder: (_, __) => const DashboardScreen()),
    GoRoute(path: '/wines/new', builder: (_, __) => const WineFormScreen()),
    GoRoute(path: '/review/:wineId', builder: (_, state) => ReviewScreen(wineId: state.pathParameters['wineId']!)),
  ],
);

class WineCellarApp extends StatelessWidget {
  const WineCellarApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'WineCellar AI',
      themeMode: ThemeMode.system,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff8f1d2c)),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xffd35d70),
          brightness: Brightness.dark,
        ),
      ),
      routerConfig: _router,
    );
  }
}
