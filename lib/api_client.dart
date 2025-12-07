import 'package:dio/dio.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';

class ApiClient {
  final Dio dio;
  final CookieJar cookieJar;

  ApiClient._internal(this.dio, this.cookieJar);

  factory ApiClient({required String baseUrl}) {
    final dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        // ha HTTP-n fut a backend (nem HTTPS), ezt érdemes bekapcsolni:
        followRedirects: false,
        validateStatus: (status) => status != null && status < 500,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 15),
      ),
    );

    final cookieJar = CookieJar();
    dio.interceptors.add(CookieManager(cookieJar));

    return ApiClient._internal(dio, cookieJar);
  }
}
