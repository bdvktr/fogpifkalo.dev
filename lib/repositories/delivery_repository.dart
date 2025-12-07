import '../api_client.dart';
import '../models/delivery_order.dart';
import '../models/delivery_order_detail.dart';

class DeliveryRepository {
  final ApiClient apiClient;

  DeliveryRepository({required this.apiClient});

  Future<List<DeliveryOrder>> fetchPendingOrders() async {
    final dio = apiClient.dio;

    final response = await dio.get('/delivery/orders');

    if (response.statusCode != 200) {
      throw Exception('Nem sikerült lekérdezni a rendeléseket.');
    }

    final data = response.data as Map<String, dynamic>;

    if (data['success'] != true) {
      throw Exception(data['message'] ?? 'Ismeretlen hiba a válaszban.');
    }

    final List<dynamic> ordersJson = data['orders'] ?? [];

    return ordersJson
        .map((o) => DeliveryOrder.fromJson(o as Map<String, dynamic>))
        .toList();
  }

  Future<void> completeOrder(int orderId) async {
    final dio = apiClient.dio;

    final response = await dio.put('/delivery/orders/$orderId/complete');

    if (response.statusCode != 200) {
      throw Exception('Nem sikerült teljesítettre állítani a rendelést.');
    }

    final data = response.data as Map<String, dynamic>;

    if (data['success'] != true) {
      throw Exception(
        data['message'] ?? 'Ismeretlen hiba a státusz frissítésnél.',
      );
    }
  }

  //Rendelés részleteinek lekérése
  Future<DeliveryOrderDetail> fetchOrderDetail(int orderId) async {
    final dio = apiClient.dio;

    final response = await dio.get('/delivery/orders/$orderId');

    if (response.statusCode != 200) {
      throw Exception('Nem sikerült lekérdezni a rendelés részleteit.');
    }

    final data = response.data as Map<String, dynamic>;

    if (data['success'] != true) {
      throw Exception(
        data['message'] ??
            'Ismeretlen hiba a rendelés részleteinek lekérdezésénél.',
      );
    }

    // A JSON-t a DeliveryOrderDetail.fromJson alakítja át modellé
    return DeliveryOrderDetail.fromJson(data);
  }
}
