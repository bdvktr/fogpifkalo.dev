import 'package:flutter/material.dart';

import '../repositories/delivery_repository.dart';
import '../models/delivery_order.dart';
import '../models/user.dart';
import 'order_detail_screen.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class OrdersScreen extends StatefulWidget {
  final DeliveryRepository deliveryRepository;
  final User currentUser;

  const OrdersScreen({
    super.key,
    required this.deliveryRepository,
    required this.currentUser,
  });

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  late Future<List<DeliveryOrder>> _futureOrders;
  IO.Socket? _socket;

  void _setupSocket() {
    // Ugyanazt az IP-t használd, mint az ApiClient baseUrl-ben, csak /api nélkül!
    final socket = IO.io(
      'http://192.168.1.108:3000',
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .build(),
    );

    socket.onConnect((_) {
      debugPrint('WS connected: ${socket.id}');
    });

    socket.on('pendingOrdersUpdated', (_) {
      debugPrint('WS: pendingOrdersUpdated event received');
      _refresh(); // 🔹 REST-ből újratöltjük a listát
    });

    socket.onDisconnect((_) {
      debugPrint('WS disconnected');
    });

    socket.connect();
    _socket = socket;
  }

  @override
  void initState() {
    super.initState();
    _futureOrders = widget.deliveryRepository.fetchPendingOrders();
    _setupSocket();
  }

  Future<void> _refresh() async {
    setState(() {
      _futureOrders = widget.deliveryRepository.fetchPendingOrders();
    });
    await _futureOrders;
  }

  String _formatDate(DateTime dt) {
    // nagyon egyszerű formázás; később használhatsz intl csomagot
    return '${dt.year}.${dt.month.toString().padLeft(2, '0')}.${dt.day.toString().padLeft(2, '0')} '
        '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Folyamatban lévő rendelések (${widget.currentUser.name})'),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<DeliveryOrder>>(
          future: _futureOrders,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError) {
              return ListView(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Text(
                      'Hiba történt: ${snapshot.error}',
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
                ],
              );
            }

            final orders = snapshot.data ?? [];

            if (orders.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 100),
                  Center(
                    child: Text('Jelenleg nincs folyamatban lévő rendelés.'),
                  ),
                ],
              );
            }

            return ListView.builder(
              itemCount: orders.length,
              itemBuilder: (context, index) {
                final o = orders[index];

                return Card(
                  margin: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(
                            'Rendelés #${o.id} - ${o.totalPrice.toStringAsFixed(0)} Ft',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Dátum: ${_formatDate(o.createdAt)}'),
                              Text('Vevő: ${o.userName} (${o.userEmail})'),
                              Text('Címzett: ${o.shippingName}'),
                              Text('Telefon: ${o.shippingPhone}'),
                              Text('Cím: ${o.shippingAddress}'),
                            ],
                          ),
                          trailing: const Text(
                            'Folyamatban',
                            style: TextStyle(
                              color: Colors.orange,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => OrderDetailScreen(
                                  orderId: o.id,
                                  deliveryRepository: widget.deliveryRepository,
                                ),
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerRight,
                          child: ElevatedButton(
                            onPressed: () async {
                              final confirmed = await showDialog<bool>(
                                context: context,
                                builder: (ctx) => AlertDialog(
                                  title: const Text('Rendelés átadva?'),
                                  content: Text(
                                    'Biztosan jelzed, hogy a #${o.id} rendelést átadtad a vevőnek?',
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.of(ctx).pop(false),
                                      child: const Text('Mégse'),
                                    ),
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.of(ctx).pop(true),
                                      child: const Text('Igen'),
                                    ),
                                  ],
                                ),
                              );

                              if (confirmed != true) return;

                              try {
                                await widget.deliveryRepository.completeOrder(
                                  o.id,
                                );

                                if (!mounted) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      'Rendelés #${o.id} státusza teljesítettre állítva.',
                                    ),
                                  ),
                                );

                                // lista frissítése, hogy eltűnjön a pending közül
                                await _refresh();
                              } catch (e) {
                                if (!mounted) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      'Hiba a státusz frissítésekor: $e',
                                    ),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                              }
                            },
                            child: const Text('Átadva'),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  @override
  void dispose() {
    _socket?.dispose();
    super.dispose();
  }
}
