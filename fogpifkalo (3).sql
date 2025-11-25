-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Gép: localhost:3306
-- Létrehozás ideje: 2025. Nov 25. 19:26
-- Kiszolgáló verziója: 5.7.24
-- PHP verzió: 8.3.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `fogpifkalo`
--

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `cart_items`
--

CREATE TABLE `cart_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- A tábla adatainak kiíratása `cart_items`
--

INSERT INTO `cart_items` (`id`, `user_id`, `product_id`, `quantity`, `created_at`) VALUES
(1, 1, 1, 2, '2025-11-13 23:10:23'),
(2, 2, 1, 1, '2025-11-21 08:32:52'),
(3, 2, 5, 1, '2025-11-21 08:44:35');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `orders`
--

CREATE TABLE `orders` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `total_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `shipping_name` varchar(255) DEFAULT NULL,
  `shipping_phone` varchar(50) DEFAULT NULL,
  `shipping_address` varchar(255) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `note` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- A tábla adatainak kiíratása `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `status`, `total_price`, `created_at`, `shipping_name`, `shipping_phone`, `shipping_address`, `payment_method`, `note`) VALUES
(1, 2, 'pending', '2890.00', '2025-11-14 08:28:22', NULL, NULL, NULL, NULL, NULL),
(2, 2, 'completed', '2890.00', '2025-11-14 08:55:33', NULL, NULL, NULL, NULL, NULL),
(3, 2, 'completed', '2490.00', '2025-11-14 09:35:47', NULL, NULL, NULL, NULL, NULL),
(4, 2, 'pending', '3390.00', '2025-11-14 12:18:08', NULL, NULL, NULL, NULL, NULL),
(5, 2, 'pending', '2890.00', '2025-11-14 12:29:24', NULL, NULL, NULL, NULL, NULL),
(6, 2, 'completed', '2890.00', '2025-11-14 13:31:10', NULL, NULL, NULL, NULL, NULL),
(8, 2, 'cancelled', '3790.00', '2025-11-14 19:35:11', NULL, NULL, NULL, NULL, NULL),
(9, 2, 'pending', '2890.00', '2025-11-14 20:39:31', NULL, NULL, NULL, NULL, NULL),
(10, 2, 'pending', '2890.00', '2025-11-19 13:15:53', NULL, NULL, NULL, NULL, NULL),
(11, 2, 'pending', '9670.00', '2025-11-20 21:51:15', 'Bédy Viktor', '2321312312', 'WEte János', 'cash', 'Helo');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `order_items`
--

CREATE TABLE `order_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL,
  `unit_price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- A tábla adatainak kiíratása `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`) VALUES
(1, 1, 1, 1, '2890.00'),
(2, 2, 1, 1, '2890.00'),
(3, 3, 3, 1, '2490.00'),
(4, 4, 2, 1, '3390.00'),
(5, 5, 1, 1, '2890.00'),
(6, 6, 1, 1, '2890.00'),
(8, 8, 5, 1, '3790.00'),
(9, 9, 1, 1, '2890.00'),
(10, 10, 1, 1, '2890.00'),
(11, 11, 1, 1, '2890.00'),
(12, 11, 2, 2, '3390.00');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `products`
--

CREATE TABLE `products` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `category` enum('burger','side','drink','sauce') NOT NULL DEFAULT 'burger'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- A tábla adatainak kiíratása `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `price`, `image_url`, `is_active`, `created_at`, `category`) VALUES
(1, 'Classic Burger', 'Angus marhahús, cheddar, paradicsom, saláta, házi szósz.', '2890.00', '', 1, '2025-11-13 23:03:25', 'burger'),
(2, 'BBQ Bacon Burger', 'Füstös BBQ szósz, karamellizált hagyma és bacon.', '3390.00', '', 1, '2025-11-13 23:03:25', 'burger'),
(3, 'Veggie Delight', 'Csicseriborsó pogácsa, avokádó, friss zöldek.', '2490.00', '', 1, '2025-11-13 23:03:25', 'burger'),
(4, 'Spicy Inferno', 'Jalapeño, pepper jack sajt és csípős szósz.', '3090.00', '', 1, '2025-11-13 23:03:25', 'burger'),
(5, 'Double Smash', 'Dupla hús, dupla sajt, igazi brutál burger.', '3790.00', '', 1, '2025-11-13 23:03:25', 'burger'),
(8, 'Coca Cola 0,5 L', 'Coca cola', '599.00', '0', 1, '2025-11-21 11:12:28', 'drink');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `reservations`
--

CREATE TABLE `reservations` (
  `id` int(10) UNSIGNED NOT NULL,
  `table_number` tinyint(3) UNSIGNED NOT NULL,
  `reservation_date` date NOT NULL,
  `reservation_time` time NOT NULL,
  `end_time` time DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `people_count` tinyint(3) UNSIGNED NOT NULL,
  `note` text,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- A tábla adatainak kiíratása `reservations`
--

INSERT INTO `reservations` (`id`, `table_number`, `reservation_date`, `reservation_time`, `end_time`, `name`, `phone`, `people_count`, `note`, `user_id`, `status`, `created_at`) VALUES
(1, 2, '2025-11-25', '06:33:00', NULL, 'Bédy Viktor', '06203651451', 2, NULL, NULL, 'confirmed', '2025-11-21 12:25:59'),
(2, 3, '2025-11-25', '17:31:00', NULL, 'Bédy Viktor O', '06204651451', 3, NULL, NULL, 'confirmed', '2025-11-21 14:32:03'),
(3, 3, '2025-11-27', '19:30:00', '21:00:00', 'BEDY VIKTOR OLIVER', '06 20 514 9495', 3, NULL, NULL, 'confirmed', '2025-11-25 19:58:23');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT '0',
  `name` varchar(100) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- A tábla adatainak kiíratása `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `is_admin`, `name`, `created_at`) VALUES
(1, 'teszt@example.com', '$2b$10$2MO2DTj3Rl0Dw1wOupmJNOc872VA1ZwKZool41KTYS3EG4bcLgXka', 0, 'Teszt Elek', '2025-11-13 22:31:33'),
(2, 'laminaltpadlottv@gmail.com', '$2b$10$aKg9aj7maKcPXNNoCCDMI.OgHZFnN80x1gPNCe73uNYn4GIYr/wpG', 1, 'Bédy Viktor', '2025-11-13 22:42:49'),
(3, 'orcshaman13@gmail.com', '$2b$10$ON1R912ppRzAVJ.F4LQ39.T1Q306dmBENNvGTjinC0JJzrfhs9oXu', 0, 'Viktor Bédy', '2025-11-14 10:26:57'),
(4, 'laminaltpadlott@gmail.com', '$2b$10$C1nKiGyPT17l7oMQjo6ZEu9s/X1Q4jKh21AUKb8QwqoTGPD0eAR9W', 0, 'Bédy Viktor', '2025-11-20 20:52:34'),
(5, 'laminaltpadlot@gmail.com', '$2b$10$SO.o/i9YUzp2Nevi73gGg.sFSG21T0NW/qFTU2LgyedSMyKE8qL6m', 0, 'Bédy Viktor', '2025-11-20 21:03:26');

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_user_product` (`user_id`,`product_id`),
  ADD KEY `fk_cart_product` (`product_id`);

--
-- A tábla indexei `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_orders_user` (`user_id`);

--
-- A tábla indexei `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_orderitems_order` (`order_id`),
  ADD KEY `fk_orderitems_product` (`product_id`);

--
-- A tábla indexei `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT a táblához `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT a táblához `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT a táblához `products`
--
ALTER TABLE `products`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT a táblához `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT a táblához `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_orderitems_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_orderitems_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
