class User {
  final int id;
  final String name;
  final String email;
  final bool isAdmin;
  final bool isDelivery;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.isAdmin,
    required this.isDelivery,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      name: (json['name'] ?? '') as String,
      email: (json['email'] ?? '') as String,
      isAdmin: (json['isAdmin'] ?? false) as bool,
      isDelivery: (json['isDelivery'] ?? false) as bool,
    );
  }
}
  