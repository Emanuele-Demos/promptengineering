import 'package:flutter/material.dart';

import '../services/api_client.dart';

class ReviewScreen extends StatefulWidget {
  const ReviewScreen({required this.wineId, super.key});

  final String wineId;

  @override
  State<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends State<ReviewScreen> {
  final _formKey = GlobalKey<FormState>();
  final _api = ApiClient();
  int _rating = 5;
  bool _buyAgain = true;
  bool _saving = false;
  final Map<String, TextEditingController> _fields = {
    'aroma': TextEditingController(),
    'color': TextEditingController(),
    'body': TextEditingController(),
    'acidity': TextEditingController(),
    'tannins': TextEditingController(),
    'persistence': TextEditingController(),
    'balance': TextEditingController(),
    'complexity': TextEditingController(),
    'pairing': TextEditingController(),
    'serving_temperature': TextEditingController(),
    'occasion': TextEditingController(),
    'comment': TextEditingController(),
  };

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    await _api.consumeWithReview({
      'wine_id': int.parse(widget.wineId),
      'rating': _rating,
      'would_buy_again': _buyAgain,
      for (final entry in _fields.entries) entry.key: entry.value.text,
    });
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Recensione obbligatoria')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Slider(
              value: _rating.toDouble(),
              min: 1,
              max: 5,
              divisions: 4,
              label: '$_rating stelle',
              onChanged: (value) => setState(() => _rating = value.round()),
            ),
            for (final entry in _fields.entries)
              TextFormField(
                controller: entry.value,
                minLines: entry.key == 'comment' ? 3 : 1,
                maxLines: entry.key == 'comment' ? 5 : 1,
                decoration: InputDecoration(labelText: _label(entry.key)),
                validator: (value) => value == null || value.trim().isEmpty ? 'Campo obbligatorio' : null,
              ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _buyAgain,
              title: const Text('Lo ricompreresti?'),
              onChanged: (value) => setState(() => _buyAgain = value),
            ),
            FilledButton.icon(
              onPressed: _saving ? null : _save,
              icon: const Icon(Icons.check),
              label: const Text('Salva e scala bottiglia'),
            ),
          ],
        ),
      ),
    );
  }

  String _label(String key) {
    return {
      'aroma': 'Profumo',
      'color': 'Colore',
      'body': 'Corpo',
      'acidity': 'Acidita',
      'tannins': 'Tannini',
      'persistence': 'Persistenza',
      'balance': 'Equilibrio',
      'complexity': 'Complessita',
      'pairing': 'Abbinamento',
      'serving_temperature': 'Temperatura di servizio',
      'occasion': 'Occasione',
      'comment': 'Commento personale',
    }[key]!;
  }
}
