// ignore: unused_import
import 'package:dio/dio.dart';

import '../api_client.dart';
import '../models/user.dart';   

class AuthRepository {
  final ApiClient apiClient;

  AuthRepository({required this.apiClient});

  /// Bejelentkezés a backend /api/login endpointjára.
  /// A backend cookie-kat állít (ACCESS_TOKEN, REFRESH_TOKEN), ezt a dio+cookie_jar kezeli.
  Future<User> login({
    required String email,
    required String password,
  }) async {
    final dio = apiClient.dio;

    final response = await dio.post(
      '/login',
      data: {
        'email': email,
        'password': password,
      },
      // Node/Express esetén a cookie-k így is rendben lesznek
    );

    if (response.statusCode != 200) {
      final message = response.data is Map<String, dynamic>
          ? (response.data['message'] ?? 'Ismeretlen hiba')
          : 'Hibás email vagy jelszó.';
      throw Exception(message);
    }

    // A login után a cookie-k már a cookieJar-ban vannak.
    // Most lekérjük /api/me-t, hogy megkapjuk a user + isDelivery infót.
    final meResponse = await dio.get('/me');

    if (meResponse.statusCode != 200 ||
        meResponse.data == null ||
        meResponse.data['loggedIn'] != true) {
      throw Exception('Nem sikerült lekérdezni a felhasználói adatokat.');
    }

    final userJson = meResponse.data['user'] as Map<String, dynamic>;
    final user = User.fromJson(userJson);

    // Csak delivery account léphet be mobilra
    if (!user.isDelivery) {
      throw Exception(
          'Ez a fiók nem jogosult a futár alkalmazás használatára.');
    }

    return user;
  }

  /// /api/me hívás – később is használhatod, ha szükséges
  Future<User?> getCurrentUser() async {
    final dio = apiClient.dio;
    final response = await dio.get('/me');

    if (response.statusCode != 200 ||
        response.data == null ||
        response.data['loggedIn'] != true) {
      return null;
    }

    final userJson = response.data['user'] as Map<String, dynamic>;
    return User.fromJson(userJson);
  }
}
