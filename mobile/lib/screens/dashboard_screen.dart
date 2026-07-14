import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../models/wine.dart';
import '../services/api_client.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _api = ApiClient();
  late Future<_DashboardData> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_DashboardData> _load() async {
    final dashboard = await _api.getDashboard();
    final wines = (await _api.getWines()).map((json) => Wine.fromJson(json as Map<String, dynamic>)).toList();
    return _DashboardData(dashboard, wines);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('WineCellar AI'),
        actions: [
          IconButton(
            tooltip: 'Aggiungi vino',
            onPressed: () => context.push('/wines/new'),
            icon: const Icon(Icons.add),
          ),
        ],
      ),
      body: FutureBuilder<_DashboardData>(
        future: _future,
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final data = snapshot.data!;
          return RefreshIndicator(
            onRefresh: () async => setState(() => _future = _load()),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    _MetricCard(label: 'Bottiglie', value: '${data.dashboard['total_bottles']}'),
                    _MetricCard(label: 'Valore', value: 'EUR ${data.dashboard['estimated_value']}'),
                    _MetricCard(label: 'Pronti', value: '${data.dashboard['ready_to_drink']}'),
                    _MetricCard(label: 'Affinamento', value: '${data.dashboard['aging']}'),
                  ],
                ),
                const SizedBox(height: 24),
                Text('Ultimi vini', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                for (final wine in data.wines)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text('${wine.name} ${wine.vintage ?? ''}'),
                    subtitle: Text('${wine.producer} - ${wine.region ?? 'Regione non impostata'}'),
                    trailing: FilledButton.tonalIcon(
                      onPressed: wine.quantity > 0 ? () => context.push('/review/${wine.id}') : null,
                      icon: const Icon(Icons.wine_bar),
                      label: Text('${wine.quantity}'),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 170,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Theme.of(context).textTheme.labelLarge),
              const SizedBox(height: 8),
              Text(value, style: Theme.of(context).textTheme.headlineSmall),
            ],
          ),
        ),
      ),
    );
  }
}

class _DashboardData {
  const _DashboardData(this.dashboard, this.wines);
  final Map<String, dynamic> dashboard;
  final List<Wine> wines;
}
