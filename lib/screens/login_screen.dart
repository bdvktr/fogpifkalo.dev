import 'package:flutter/material.dart';

import '../repositories/auth_repository.dart';
import '../models/user.dart';
import 'orders_screen.dart';
import '../repositories/delivery_repository.dart';
import '../api_client.dart';

class LoginScreen extends StatefulWidget {
  final AuthRepository authRepository;
  final DeliveryRepository deliveryRepository;
  final ApiClient apiClient;

  const LoginScreen({
    super.key,
    required this.authRepository,
    required this.deliveryRepository,
    required this.apiClient,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final User user = await widget.authRepository.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      // Ha idáig eljutunk, akkor biztosan isDelivery === true
      if (!mounted) return;

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => OrdersScreen(
            deliveryRepository: widget.deliveryRepository,
            currentUser: user,
          ),
        ),
      );
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Futár bejelentkezés'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            if (_error != null) ...[
              Text(
                _error!,
                style: const TextStyle(color: Colors.red),
              ),
              const SizedBox(height: 8),
            ],
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: 'Email',
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(
                labelText: 'Jelszó',
              ),
              obscureText: true,
            ),
            const SizedBox(height: 24),
            _isLoading
                ? const CircularProgressIndicator()
                : ElevatedButton(
                    onPressed: _handleLogin,
                    child: const Text('Bejelentkezés'),
                  ),
          ],
        ),
      ),
    );
  }
}
