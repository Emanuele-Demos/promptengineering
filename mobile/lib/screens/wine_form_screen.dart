import 'package:flutter/material.dart';

import '../services/api_client.dart';

class WineFormScreen extends StatefulWidget {
  const WineFormScreen({super.key});

  @override
  State<WineFormScreen> createState() => _WineFormScreenState();
}

class _WineFormScreenState extends State<WineFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _api = ApiClient();
  final _name = TextEditingController();
  final _producer = TextEditingController();
  final _vintage = TextEditingController();
  final _region = TextEditingController();
  final _quantity = TextEditingController(text: '1');
  bool _saving = false;

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    await _api.createWine({
      'name': _name.text,
      'producer': _producer.text,
      'vintage': int.tryParse(_vintage.text),
      'region': _region.text,
      'quantity': int.parse(_quantity.text),
      'status': 'aging',
    });
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nuovo vino')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 0, icon: Icon(Icons.camera_alt), label: Text('OCR')),
                ButtonSegment(value: 1, icon: Icon(Icons.qr_code_scanner), label: Text('Barcode')),
                ButtonSegment(value: 2, icon: Icon(Icons.edit), label: Text('Manuale')),
              ],
              selected: const {2},
              onSelectionChanged: (_) {},
            ),
            const SizedBox(height: 16),
            TextFormField(controller: _name, decoration: const InputDecoration(labelText: 'Nome'), validator: _required),
            TextFormField(controller: _producer, decoration: const InputDecoration(labelText: 'Produttore'), validator: _required),
            TextFormField(controller: _vintage, decoration: const InputDecoration(labelText: 'Annata'), keyboardType: TextInputType.number),
            TextFormField(controller: _region, decoration: const InputDecoration(labelText: 'Regione')),
            TextFormField(controller: _quantity, decoration: const InputDecoration(labelText: 'Quantita'), keyboardType: TextInputType.number, validator: _required),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: _saving ? null : _save,
              icon: _saving ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.save),
              label: const Text('Salva vino'),
            ),
          ],
        ),
      ),
    );
  }

  String? _required(String? value) => value == null || value.trim().isEmpty ? 'Campo obbligatorio' : null;
}
