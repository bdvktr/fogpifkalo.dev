int _toInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}

double _toDouble(dynamic value) {
  if (value is double) return value;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}

class DeliveryOrder {
  final int id;
  final DateTime createdAt;
  final String status;
  final double totalPrice;
  final String shippingName;
  final String shippingPhone;
  final String shippingAddress;
  final String userEmail;
  final String userName;

  DeliveryOrder({
    required this.id,
    required this.createdAt,
    required this.status,
    required this.totalPrice,
    required this.shippingName,
    required this.shippingPhone,
    required this.shippingAddress,
    required this.userEmail,
    required this.userName,
  });

  factory DeliveryOrder.fromJson(Map<String, dynamic> json) {
    return DeliveryOrder(
      id: _toInt(json['id']),
      createdAt: DateTime.parse(json['created_at'] as String),
      status: (json['status'] ?? '') as String,
      totalPrice: _toDouble(json['total_price']),
      shippingName: (json['shipping_name'] ?? '') as String,
      shippingPhone: (json['shipping_phone'] ?? '') as String,
      shippingAddress: (json['shipping_address'] ?? '') as String,
      userEmail: (json['user_email'] ?? '') as String,
      userName: (json['user_name'] ?? '') as String,
    );
  }
}
