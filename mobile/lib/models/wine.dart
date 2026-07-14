class Wine {
  const Wine({
    required this.id,
    required this.name,
    required this.producer,
    required this.quantity,
    required this.status,
    this.vintage,
    this.region,
    this.marketPrice,
  });

  final int id;
  final String name;
  final String producer;
  final int quantity;
  final String status;
  final int? vintage;
  final String? region;
  final double? marketPrice;

  factory Wine.fromJson(Map<String, dynamic> json) {
    return Wine(
      id: json['id'] as int,
      name: json['name'] as String,
      producer: json['producer'] as String,
      quantity: json['quantity'] as int,
      status: json['status'] as String,
      vintage: json['vintage'] as int?,
      region: json['region'] as String?,
      marketPrice: (json['market_price'] as num?)?.toDouble(),
    );
  }
}
