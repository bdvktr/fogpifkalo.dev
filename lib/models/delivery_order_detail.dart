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

class OrderItem {
  final int id;
  final String name;
  final int quantity;
  final double unitPrice;

  OrderItem({
    required this.id,
    required this.name,
    required this.quantity,
    required this.unitPrice,
  });

  double get lineTotal => unitPrice * quantity;

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: _toInt(json['id']),
      name: (json['name'] ?? '') as String,
      quantity: _toInt(json['quantity']),
      unitPrice: _toDouble(json['unit_price']),
    );
  }
}

class DeliveryOrderDetail {
  final int id;
  final String status;
  final DateTime createdAt;
  final double totalPrice;
  final String shippingName;
  final String shippingPhone;
  final String shippingAddress;
  final String paymentMethod;
  final String note;
  final String userName;
  final String userEmail;
  final List<OrderItem> items;

  DeliveryOrderDetail({
    required this.id,
    required this.status,
    required this.createdAt,
    required this.totalPrice,
    required this.shippingName,
    required this.shippingPhone,
    required this.shippingAddress,
    required this.paymentMethod,
    required this.note,
    required this.userName,
    required this.userEmail,
    required this.items,
  });

  factory DeliveryOrderDetail.fromJson(Map<String, dynamic> json) {
    final order = json['order'] as Map<String, dynamic>;

    final itemsJson = (order['items'] as List<dynamic>? ?? [])
        .cast<Map<String, dynamic>>();

    return DeliveryOrderDetail(
      id: _toInt(order['id']),
      status: (order['status'] ?? '') as String,
      createdAt: DateTime.parse(order['created_at'] as String),
      totalPrice: _toDouble(order['total_price']),
      shippingName: (order['shipping_name'] ?? '') as String,
      shippingPhone: (order['shipping_phone'] ?? '') as String,
      shippingAddress: (order['shipping_address'] ?? '') as String,
      paymentMethod: (order['payment_method'] ?? '') as String,
      note: (order['note'] ?? '') as String,
      userName: (order['user']?['name'] ?? '') as String,
      userEmail: (order['user']?['email'] ?? '') as String,
      items: itemsJson.map(OrderItem.fromJson).toList(),
    );
  }
}
