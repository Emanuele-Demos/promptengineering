import 'dart:convert';

import 'package:http/http.dart' as http;

class ApiClient {
  ApiClient({http.Client? client, this.baseUrl = 'http://localhost:8080/api/v1'})
      : _client = client ?? http.Client();

  final http.Client _client;
  final String baseUrl;

  Future<Map<String, dynamic>> getDashboard() async {
    final response = await _client.get(Uri.parse('$baseUrl/cellar/dashboard'));
    return _decode(response);
  }

  Future<List<dynamic>> getWines() async {
    final response = await _client.get(Uri.parse('$baseUrl/wines'));
    return _decode(response)['data'] as List<dynamic>;
  }

  Future<Map<String, dynamic>> createWine(Map<String, dynamic> payload) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/wines'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    return _decode(response)['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> consumeWithReview(Map<String, dynamic> payload) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/wines/consume'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    return _decode(response);
  }

  Map<String, dynamic> _decode(http.Response response) {
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 400) {
      throw Exception(body['message'] ?? 'API error');
    }
    return body;
  }
}
