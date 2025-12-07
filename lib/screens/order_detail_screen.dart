import 'package:flutter/material.dart';

import '../repositories/delivery_repository.dart';
import '../models/delivery_order_detail.dart';

class OrderDetailScreen extends StatefulWidget {
  final int orderId;
  final DeliveryRepository deliveryRepository;

  const OrderDetailScreen({
    super.key,
    required this.orderId,
    required this.deliveryRepository,
  });

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  late Future<DeliveryOrderDetail> _futureDetail;

  @override
  void initState() {
    super.initState();
    _futureDetail = widget.deliveryRepository.fetchOrderDetail(widget.orderId);
  }

  String _formatDate(DateTime dt) {
    return '${dt.year}.${dt.month.toString().padLeft(2, '0')}.${dt.day.toString().padLeft(2, '0')} '
        '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Rendelés #${widget.orderId}'),
      ),
      body: FutureBuilder<DeliveryOrderDetail>(
        future: _futureDetail,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text(
                  'Hiba a rendelés betöltésekor: ${snapshot.error}',
                  style: const TextStyle(color: Colors.red),
                ),
              ),
            );
          }

          final detail = snapshot.data!;
          final items = detail.items;

          return ListView(
            padding: const EdgeInsets.all(16.0),
            children: [
              // Fejléc / alapadatok
              Text(
                'Rendelés adatai',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text('Azonosító: #${detail.id}'),
              Text('Státusz: ${detail.status}'),
              Text('Dátum: ${_formatDate(detail.createdAt)}'),
              Text('Összeg: ${detail.totalPrice.toStringAsFixed(0)} Ft'),
              const SizedBox(height: 16),

              Text(
                'Vevő / számlázás',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text('Vevő: ${detail.userName}'),
              Text('Email: ${detail.userEmail}'),
              const SizedBox(height: 16),

              Text(
                'Szállítási adatok',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text('Címzett: ${detail.shippingName}'),
              Text('Telefon: ${detail.shippingPhone}'),
              Text('Cím: ${detail.shippingAddress}'),
              if (detail.paymentMethod.isNotEmpty)
                Text('Fizetési mód: ${detail.paymentMethod}'),
              if (detail.note.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text('Megjegyzés: ${detail.note}'),
              ],
              const SizedBox(height: 16),

              Text(
                'Tételek',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              if (items.isEmpty)
                const Text('Nincsenek tételek.'),
              if (items.isNotEmpty)
                ...items.map(
                  (item) => Card(
                    margin:
                        const EdgeInsets.symmetric(vertical: 4, horizontal: 0),
                    child: ListTile(
                      title: Text(item.name),
                      subtitle: Text(
                          'Mennyiség: ${item.quantity} × ${item.unitPrice.toStringAsFixed(0)} Ft'),
                      trailing: Text(
                        '${item.lineTotal.toStringAsFixed(0)} Ft',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
