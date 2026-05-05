-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Gép: localhost:3306
-- Létrehozás ideje: 2026. Máj 05. 12:37
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
-- Tábla szerkezet ehhez a táblához `admin_audit_logs`
--

CREATE TABLE `admin_audit_logs` (
  `id` int(10) UNSIGNED NOT NULL,
  `admin_user_id` int(10) UNSIGNED DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(10) UNSIGNED DEFAULT NULL,
  `details_json` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- A tábla adatainak kiíratása `admin_audit_logs`
--

INSERT INTO `admin_audit_logs` (`id`, `admin_user_id`, `action`, `entity_type`, `entity_id`, `details_json`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 2, 'order.status.update', 'order', 9, '{\"newStatus\": \"completed\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-02 19:40:31'),
(2, 2, 'Rendelés státusz módosítás', 'order', 5, '{\"newStatus\": \"completed\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-02 19:52:31'),
(3, 2, 'Rendelés státusz módosítás', 'order', 4, '{\"newStatus\": \"completed\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-02 20:29:34'),
(4, 2, 'Termék inaktiválása', 'product', 3, '{}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-02 22:17:06'),
(5, 2, 'Termék újraaktiválása', 'product', 3, '{}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-02 22:17:10'),
(6, 2, 'Termék inaktiválása', 'product', 10, '{}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-02 22:19:08'),
(7, 2, 'Termék újraaktiválása', 'product', 10, '{}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-02 22:19:15'),
(8, 2, 'Termék inaktiválása', 'product', 10, '{}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-03 12:43:35'),
(9, 2, 'Termék újraaktiválása', 'product', 10, '{}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-03 12:43:47'),
(10, 2, 'Termék inaktiválása', 'product', 10, '{}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-04 10:49:29'),
(11, 2, 'Termék újraaktiválása', 'product', 10, '{}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-04 10:49:32'),
(12, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-05 09:36:23'),
(13, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-05 09:37:50'),
(14, 2, 'Termék módosítása', 'product', 1, '{\"name\": \"Classic Burger\", \"price\": 2890, \"category\": \"burger\", \"is_active\": 1}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-05 09:47:33'),
(15, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-05 09:50:35'),
(16, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-05 09:55:58'),
(17, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-05 10:00:24'),
(18, 2, 'Termék módosítása', 'product', 5, '{\"name\": \"Double Smash\", \"price\": 3790, \"category\": \"burger\", \"is_active\": 1}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-05 10:03:32'),
(19, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-05 10:05:22'),
(20, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-05 10:10:43'),
(21, 2, 'Termék létrehozása', 'product', 12, '{\"name\": \"Farm Burger\", \"price\": 5990, \"category\": \"burger\", \"is_active\": 1}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-05 10:13:27'),
(22, 2, 'Termék módosítása', 'product', 1, '{\"name\": \"Classic Burger\", \"price\": 2890, \"category\": \"burger\", \"is_active\": 1, \"is_special_offer\": true}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-05 10:23:56'),
(23, 2, 'Termék módosítása', 'product', 12, '{\"name\": \"Farm Burger\", \"price\": 5990, \"category\": \"burger\", \"is_active\": 1, \"is_special_offer\": true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-12-08 11:58:20'),
(24, 2, 'Termék módosítása', 'product', 1, '{\"name\": \"Crunchicken Burger\", \"price\": 2890, \"category\": \"burger\", \"is_active\": 1, \"is_special_offer\": true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2025-12-19 12:41:19'),
(25, 2, 'Termék módosítása', 'product', 1, '{\"name\": \"Crunchicken Burger\", \"price\": 2890, \"category\": \"burger\", \"is_active\": 1, \"is_special_offer\": true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2025-12-19 12:42:44'),
(26, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1, \"is_special_offer\": true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2025-12-19 12:43:57'),
(27, 2, 'Termék módosítása', 'product', 1, '{\"name\": \"Crunchicken Burger\", \"price\": 2890, \"category\": \"burger\", \"is_active\": 1, \"is_special_offer\": true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2025-12-19 12:51:31'),
(28, 2, 'Termék módosítása', 'product', 11, '{\"name\": \"Uborkás-Majonéz szósz\", \"price\": 499, \"category\": \"side\", \"is_active\": 1, \"is_special_offer\": false}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2025-12-21 10:07:06'),
(29, 2, 'Termék módosítása', 'product', 8, '{\"name\": \"Coca Cola 0,5 L\", \"price\": 599, \"category\": \"drink\", \"is_active\": 1, \"is_special_offer\": false}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2025-12-21 10:09:51'),
(30, 2, 'Termék módosítása', 'product', 11, '{\"name\": \"Uborkás-Majonéz szósz\", \"price\": 499, \"category\": \"sauce\", \"is_active\": 1, \"is_special_offer\": false}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2025-12-21 10:10:14'),
(31, 2, 'Termék módosítása', 'product', 9, '{\"name\": \"Fanta Light 0,5L\", \"price\": 599, \"category\": \"drink\", \"is_active\": 1, \"is_special_offer\": false}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2025-12-21 10:10:28'),
(32, 2, 'Termék módosítása', 'product', 10, '{\"name\": \"BBQ szósz\", \"price\": 399, \"category\": \"sauce\", \"is_active\": 1, \"is_special_offer\": false}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2025-12-21 10:40:24'),
(33, 2, 'Termék létrehozása', 'product', 13, '{\"name\": \"Steak burgonya\", \"price\": 899, \"category\": \"side\", \"is_active\": 1, \"is_special_offer\": false}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-03 16:02:59'),
(34, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1, \"is_special_offer\": true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-14 10:17:38'),
(35, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1, \"is_special_offer\": true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-14 10:22:19'),
(36, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1, \"is_special_offer\": true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-14 10:22:33'),
(37, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1, \"is_special_offer\": true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-14 11:19:06'),
(38, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1, \"is_special_offer\": true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-14 21:20:10'),
(39, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1, \"is_special_offer\": true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-14 21:20:19'),
(40, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1, \"is_special_offer\": true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-14 21:20:38'),
(41, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1, \"is_special_offer\": true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-14 21:20:55'),
(42, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1, \"is_special_offer\": true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-16 12:37:49'),
(43, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1, \"is_special_offer\": true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-27 10:56:23'),
(44, 2, 'Rendelés státusz módosítás', 'order', 32, '{\"newStatus\": \"completed\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-27 10:59:13'),
(45, 2, 'Termék módosítása', 'product', 2, '{\"name\": \"BBQ Bacon Burger\", \"price\": 3390, \"category\": \"burger\", \"is_active\": 1, \"is_special_offer\": true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-03 13:52:53'),
(46, 2, 'Rendelés státusz módosítás', 'order', 33, '{\"newStatus\": \"pending\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-03 13:53:18'),
(47, 2, 'Rendelés státusz módosítás', 'order', 33, '{\"newStatus\": \"completed\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-03 13:53:32'),
(48, 2, 'Termék inaktiválása', 'product', 2, '{}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-02 18:39:20'),
(49, 2, 'Termék újraaktiválása', 'product', 2, '{}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-02 18:39:47'),
(50, 2, 'Foglalás státusz módosítás', 'reservation', 23, '{\"newStatus\": \"cancelled\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 19:22:02'),
(51, 2, 'Foglalás státusz módosítás', 'reservation', 24, '{\"newStatus\": \"confirmed\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:44:30'),
(52, 2, 'Foglalás státusz módosítás', 'reservation', 24, '{\"newStatus\": \"confirmed\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:55:15'),
(53, 2, 'Foglalás státusz módosítás', 'reservation', 24, '{\"newStatus\": \"cancelled\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:56:09'),
(54, 2, 'Foglalás státusz módosítás', 'reservation', 22, '{\"newStatus\": \"cancelled\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:56:11'),
(55, 2, 'Foglalás státusz módosítás', 'reservation', 21, '{\"newStatus\": \"cancelled\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:56:13'),
(56, 2, 'Foglalás státusz módosítás', 'reservation', 20, '{\"newStatus\": \"cancelled\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:56:14'),
(57, 2, 'Foglalás státusz módosítás', 'reservation', 19, '{\"newStatus\": \"cancelled\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:56:16'),
(58, 2, 'Foglalás státusz módosítás', 'reservation', 18, '{\"newStatus\": \"cancelled\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:56:18'),
(59, 2, 'Foglalás státusz módosítás', 'reservation', 17, '{\"newStatus\": \"cancelled\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:56:19'),
(60, 2, 'Foglalás státusz módosítás', 'reservation', 15, '{\"newStatus\": \"cancelled\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:56:21'),
(61, 2, 'Foglalás státusz módosítás', 'reservation', 14, '{\"newStatus\": \"cancelled\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:56:23'),
(62, 2, 'Foglalás státusz módosítás', 'reservation', 13, '{\"newStatus\": \"cancelled\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:56:24'),
(63, 2, 'Foglalás státusz módosítás', 'reservation', 9, '{\"newStatus\": \"cancelled\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:56:26'),
(64, 2, 'Foglalás státusz módosítás', 'reservation', 8, '{\"newStatus\": \"cancelled\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:56:28'),
(65, 2, 'Foglalás státusz módosítás', 'reservation', 7, '{\"newStatus\": \"cancelled\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:56:31'),
(66, 2, 'Foglalás státusz módosítás', 'reservation', 6, '{\"newStatus\": \"cancelled\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:56:33'),
(67, 2, 'Foglalás státusz módosítás', 'reservation', 3, '{\"newStatus\": \"cancelled\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:56:35'),
(68, 2, 'Foglalás státusz módosítás', 'reservation', 2, '{\"newStatus\": \"cancelled\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:56:36'),
(69, 2, 'Foglalás státusz módosítás', 'reservation', 1, '{\"newStatus\": \"cancelled\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-11 22:56:38'),
(70, 2, 'Termék létrehozása', 'product', 14, '{\"name\": \"Crispers burgonya\", \"price\": 499, \"category\": \"side\", \"is_active\": 1, \"is_special_offer\": false}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-01 13:25:15'),
(71, 2, 'Termék létrehozása', 'product', 15, '{\"name\": \"Édesburgonya\", \"price\": 598, \"category\": \"side\", \"is_active\": 1, \"is_special_offer\": false}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-01 13:25:55'),
(72, 2, 'Termék létrehozása', 'product', 16, '{\"name\": \"Secret szósz\", \"price\": 498, \"category\": \"sauce\", \"is_active\": 1, \"is_special_offer\": false}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-01 14:24:28'),
(73, 2, 'Termék létrehozása', 'product', 17, '{\"name\": \"Coleslaw saláta\", \"price\": 498, \"category\": \"sauce\", \"is_active\": 1, \"is_special_offer\": false}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-01 14:45:02'),
(74, 2, 'Termék létrehozása', 'product', 18, '{\"name\": \"BBQ Tál\", \"price\": 5999, \"category\": \"main\", \"is_active\": 1, \"is_special_offer\": false}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 11:23:07'),
(75, 2, 'Termék létrehozása', 'product', 40, '{\"name\": \"Coleslaw\", \"price\": 550, \"category\": \"sauce\", \"is_active\": 1, \"is_special_offer\": false}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 14:19:57');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `cart_items`
--

CREATE TABLE `cart_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `config_json` json DEFAULT NULL,
  `config_key` varchar(120) NOT NULL DEFAULT 'base',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `delivery_zones`
--

CREATE TABLE `delivery_zones` (
  `id` int(10) UNSIGNED NOT NULL,
  `city` varchar(100) NOT NULL,
  `delivery_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- A tábla adatainak kiíratása `delivery_zones`
--

INSERT INTO `delivery_zones` (`id`, `city`, `delivery_fee`, `is_active`, `sort_order`, `created_at`) VALUES
(1, 'Mohács', '0.00', 1, 1, '2026-05-03 17:23:27'),
(2, 'Lánycsók', '800.00', 1, 2, '2026-05-03 17:23:27'),
(3, 'Szőlőhegy', '800.00', 1, 3, '2026-05-03 17:23:27'),
(4, 'Kölked', '1200.00', 1, 4, '2026-05-03 17:23:27'),
(5, 'Somberek', '1600.00', 1, 5, '2026-05-03 17:23:27'),
(6, 'Sátorhely', '1600.00', 1, 6, '2026-05-03 17:23:27'),
(7, 'Bár', '1600.00', 1, 7, '2026-05-03 17:23:27'),
(8, 'Palotabozsok', '1800.00', 1, 8, '2026-05-03 17:23:27');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `orders`
--

CREATE TABLE `orders` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `total_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `package_count` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `packaging_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `shipping_name` varchar(255) DEFAULT NULL,
  `shipping_phone` varchar(50) DEFAULT NULL,
  `shipping_address` varchar(255) DEFAULT NULL,
  `delivery_city` varchar(100) DEFAULT NULL,
  `delivery_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_method` varchar(50) DEFAULT NULL,
  `note` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- A tábla adatainak kiíratása `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `status`, `total_price`, `subtotal`, `package_count`, `packaging_fee`, `created_at`, `shipping_name`, `shipping_phone`, `shipping_address`, `delivery_city`, `delivery_fee`, `payment_method`, `note`) VALUES
(1, 2, 'pending', '7650.00', '5850.00', 0, '0.00', '2026-05-03 17:24:08', 'Bédy Viktor', '06203651451', 'Palotabozsok, Ete János utca, 3/C', 'Palotabozsok', '1800.00', 'cash', NULL),
(2, 2, 'pending', '31430.00', '31230.00', 2, '200.00', '2026-05-05 14:08:15', 'Bédy Viktor', '06203651451', 'Mohács, Ete János utca, 3/C', 'Mohács', '0.00', 'cash', NULL);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `order_items`
--

CREATE TABLE `order_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `config_json` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- A tábla adatainak kiíratása `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`, `config_json`) VALUES
(1, 1, 23, 1, '5850.00', NULL),
(2, 2, 10, 1, '4500.00', '{\"baseType\": \"single\", \"toppings\": [], \"packagingName\": \"Kis doboz\", \"packagingType\": \"small_box\", \"packagingPrice\": 150}'),
(3, 2, 10, 1, '7130.00', '{\"sauceId\": 37, \"baseType\": \"menu\", \"toppings\": [1, 2], \"extraType\": \"sauce\", \"packagingName\": \"Nagy doboz\", \"packagingType\": \"large_box\", \"sideProductId\": 25, \"packagingPrice\": 200}'),
(4, 2, 10, 4, '4900.00', '{\"baseType\": \"single\", \"toppings\": [1], \"packagingName\": \"Kis doboz\", \"packagingType\": \"small_box\", \"packagingPrice\": 150}');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `products`
--

CREATE TABLE `products` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text,
  `ingredients` json DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_special_offer` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `category` enum('burger','main','side','drink','sauce') NOT NULL DEFAULT 'burger',
  `menu_extra_type` enum('sauce','coleslaw') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- A tábla adatainak kiíratása `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `ingredients`, `price`, `image_url`, `is_active`, `is_special_offer`, `created_at`, `category`, `menu_extra_type`) VALUES
(1, 'Classic Marha Burger', 'BBQ szósz, jégsaláta, paradicsom, marha húspogácsa, cheddar sajt, hagymalekvár, savanyú uborka', '[\"BBQ szósz\", \"jégsaláta\", \"paradicsom\", \"marha húspogácsa\", \"cheddar sajt\", \"hagymalekvár\", \"savanyú uborka\"]', '3950.00', '', 1, 0, '2026-05-03 14:07:25', 'burger', NULL),
(2, 'Mini Classic Marha Burger', 'BBQ szósz, jégsaláta, paradicsom, marha húspogácsa, cheddar sajt, hagymalekvár, savanyú uborka', '[\"BBQ szósz\", \"jégsaláta\", \"paradicsom\", \"marha húspogácsa\", \"cheddar sajt\", \"hagymalekvár\", \"savanyú uborka\"]', '2750.00', '', 1, 0, '2026-05-03 14:07:25', 'burger', NULL),
(3, 'Kick-Ass Burger', 'BBQ szósz, jégsaláta, paradicsom, dupla marha húspogácsa, dupla cheddar sajt, bacon, rántott hagymakarika', '[\"BBQ szósz\", \"jégsaláta\", \"paradicsom\", \"dupla marha húspogácsa\", \"dupla cheddar sajt\", \"bacon\", \"rántott hagymakarika\"]', '5750.00', '', 1, 0, '2026-05-03 14:07:25', 'burger', NULL),
(4, 'Hot Mama', 'chipotle-lime majonéz, jégsaláta, paradicsom, marha húspogácsa, cheddar sajt, savanyított habanero paprika', '[\"chipotle-lime majonéz\", \"jégsaláta\", \"paradicsom\", \"marha húspogácsa\", \"cheddar sajt\", \"savanyított habanero paprika\"]', '4450.00', '', 1, 0, '2026-05-03 14:07:25', 'burger', NULL),
(5, 'Farm Burger', 'fokhagymás aioli, jégsaláta, marha húspogácsa, bacon, cheddar sajt, borsos-mustáros grillezett hagyma', '[\"fokhagymás aioli\", \"jégsaláta\", \"marha húspogácsa\", \"bacon\", \"cheddar sajt\", \"borsos-mustáros grillezett hagyma\"]', '4250.00', '', 1, 0, '2026-05-03 14:07:25', 'burger', NULL),
(6, 'FatBoy Burger', 'BBQ szósz, marha húspogácsa, bacon, pulled pork, rántott hagymakarika, cheddar sajtszósz', '[\"BBQ szósz\", \"marha húspogácsa\", \"bacon\", \"pulled pork\", \"rántott hagymakarika\", \"cheddar sajtszósz\"]', '4950.00', '', 1, 0, '2026-05-03 14:07:25', 'burger', NULL),
(7, 'Smash Burger', 'spéci szósz, dupla smashed marhapogácsa, dupla cheddar sajt', '[\"spéci szósz\", \"dupla smashed marhapogácsa\", \"dupla cheddar sajt\"]', '3950.00', '', 1, 0, '2026-05-03 14:07:25', 'burger', NULL),
(8, 'Mini Smash Burger', 'spéci szósz, smashed marhapogácsa, cheddar sajt', '[\"spéci szósz\", \"smashed marhapogácsa\", \"cheddar sajt\"]', '2550.00', '', 1, 0, '2026-05-03 14:07:25', 'burger', NULL),
(9, 'Jack’s Burger', 'spéci szósz, pirított hagyma, jalapeno, marha húspogácsa, bacon, cheddar sajt, hagymalekvár', '[\"spéci szósz\", \"pirított hagyma\", \"jalapeno\", \"marha húspogácsa\", \"bacon\", \"cheddar sajt\", \"hagymalekvár\"]', '4350.00', '', 1, 0, '2026-05-03 14:07:25', 'burger', NULL),
(10, 'Busó Burger', 'Fokhagymás aioli, csalamádé, marha húspogácsa, rántott (még varia alatt) sajt', '[\"Fokhagymás aioli\", \"csalamádé\", \"marha húspogácsa\", \"rántott (még varia alatt) sajt\"]', '4350.00', '', 1, 0, '2026-05-03 14:07:25', 'burger', NULL),
(11, 'PulledPork', 'coleslaw, pulledpork, cheddar sajt, BBQ szósz', '[\"coleslaw\", \"pulledpork\", \"cheddar sajt\", \"BBQ szósz\"]', '3950.00', '', 1, 0, '2026-05-03 14:07:25', 'burger', NULL),
(12, 'SmashedJam Burger', 'Szarvasgombás aioli, dupla smashed marhapogácsa, dupla cheddar sajt, áfonyás bacon jam', '[\"Szarvasgombás aioli\", \"dupla smashed marhapogácsa\", \"dupla cheddar sajt\", \"áfonyás bacon jam\"]', '4550.00', '', 1, 0, '2026-05-03 14:07:25', 'burger', NULL),
(13, 'Oklahoma Cheese Burger', 'secret szósz, marha húspogácsa, cheddar sajtszósz, fűszeres-grillezett hagyma', '[\"secret szósz\", \"marha húspogácsa\", \"cheddar sajtszósz\", \"fűszeres-grillezett hagyma\"]', '3750.00', '', 1, 0, '2026-05-03 14:07:25', 'burger', NULL),
(14, 'Chicken Burger', 'Fokhagymás aioli, jégsaláta, paradicsom, csirke húspogácsa, füstölt edami sajt, hagymalekvár, kígyóuborka', '[\"Fokhagymás aioli\", \"jégsaláta\", \"paradicsom\", \"csirke húspogácsa\", \"füstölt edami sajt\", \"hagymalekvár\", \"kígyóuborka\"]', '3350.00', '', 1, 0, '2026-05-03 14:07:25', 'burger', NULL),
(15, 'Crispy Chicken Burger', 'secret szósz, jégsaláta, paradicsom, csirkemell ropogós bundában, füstölt edami sajt', '[\"secret szósz\", \"jégsaláta\", \"paradicsom\", \"csirkemell ropogós bundában\", \"füstölt edami sajt\"]', '3350.00', '', 1, 0, '2026-05-03 14:07:25', 'burger', NULL),
(16, 'Mini Crispy Chicken Burger', 'secret szósz, jégsaláta, paradicsom, csirkemell ropogós bundában, füstölt edami sajt', '[\"secret szósz\", \"jégsaláta\", \"paradicsom\", \"csirkemell ropogós bundában\", \"füstölt edami sajt\"]', '2250.00', '', 1, 0, '2026-05-03 14:07:25', 'burger', NULL),
(17, 'VEGA Burger', 'majonéz, rukkola, paradicsom, rántott camembert', '[\"majonéz\", \"rukkola\", \"paradicsom\", \"rántott camembert\"]', '3150.00', '', 1, 0, '2026-05-03 14:07:25', 'burger', NULL),
(18, 'Saláta grill csirkével', 'Grillezett csirkemell csíkok, jégsaláta, madársaláta, rukkola, koktélparadicsom, fokhagymás aioli, pirított kenyérkocka, parmezán sajt', '[\"Grillezett csirkemell csíkok\", \"jégsaláta\", \"madársaláta\", \"rukkola\", \"koktélparadicsom\", \"fokhagymás aioli\", \"pirított kenyérkocka\", \"parmezán sajt\"]', '4950.00', '', 1, 0, '2026-05-03 14:07:25', 'main', NULL),
(19, 'Ropogós csirkemell, crispers burgonya, friss saláta, joghurtos dresszing', NULL, NULL, '5650.00', '', 1, 0, '2026-05-03 14:07:25', 'main', NULL),
(20, 'Marhatál', 'Dupla marha húspogácsa, friss saláta, joghurtos dresszing, crispers burgonya', '[\"Dupla marha húspogácsa\", \"friss saláta\", \"joghurtos dresszing\", \"crispers burgonya\"]', '5750.00', '', 1, 0, '2026-05-03 14:07:25', 'main', NULL),
(21, 'Pistabácsi burritoja', 'fűszeres marharagu cheddarral és füstölt sajttal tortillában, crispers burgonya', '[\"fűszeres marharagu cheddarral és füstölt sajttal tortillában\", \"crispers burgonya\"]', '5550.00', '', 1, 0, '2026-05-03 14:07:25', 'main', NULL),
(22, 'Pulledpork tál', 'Pulledpork, crispers burgonya, BBQ szósz', '[\"Pulledpork\", \"crispers burgonya\", \"BBQ szósz\"]', '4950.00', '', 1, 0, '2026-05-03 14:07:25', 'main', NULL),
(23, 'BBQ tarja / oldala, coleslaw saláta, crispers burgonya', NULL, NULL, '5850.00', '', 1, 0, '2026-05-03 14:07:25', 'main', NULL),
(24, 'BBQ tál - pulledpork, bbq tarja és oldalas, coleslaw saláta, crispers burgonya', NULL, NULL, '6550.00', '', 1, 0, '2026-05-03 14:07:25', 'main', NULL),
(25, 'Crispers burgonya', NULL, NULL, '1290.00', '', 1, 0, '2026-05-03 14:07:25', 'side', NULL),
(26, 'Édesburgonya', NULL, NULL, '1490.00', '', 1, 0, '2026-05-03 14:07:25', 'side', NULL),
(27, '+ extra burgonyára: cheddar szósz + jalapeno', NULL, NULL, '790.00', '', 1, 0, '2026-05-03 14:07:25', 'side', NULL),
(28, 'Rántott hagymakarika', NULL, NULL, '1890.00', '', 1, 0, '2026-05-03 14:07:25', 'side', NULL),
(29, 'Rántott camembert falatok', NULL, NULL, '2190.00', '', 1, 0, '2026-05-03 14:07:25', 'side', NULL),
(30, 'Ketchup', NULL, NULL, '390.00', '', 1, 0, '2026-05-03 14:07:25', 'sauce', 'sauce'),
(31, 'Majonéz', NULL, NULL, '390.00', '', 1, 0, '2026-05-03 14:07:25', 'sauce', 'sauce'),
(32, 'Mustár', NULL, NULL, '390.00', '', 1, 0, '2026-05-03 14:07:25', 'sauce', 'sauce'),
(33, 'BBQ', NULL, NULL, '490.00', '', 1, 0, '2026-05-03 14:07:25', 'sauce', 'sauce'),
(34, 'Chipotle-lime majonéz', NULL, NULL, '490.00', '', 1, 0, '2026-05-03 14:07:25', 'sauce', 'sauce'),
(35, 'Cheddar sajtszósz', NULL, NULL, '490.00', '', 1, 0, '2026-05-03 14:07:25', 'sauce', 'sauce'),
(36, 'Szarvasgombás majonéz', NULL, NULL, '490.00', '', 1, 0, '2026-05-03 14:07:25', 'sauce', 'sauce'),
(37, 'Fokhagymás aioli', NULL, NULL, '490.00', '', 1, 0, '2026-05-03 14:07:25', 'sauce', 'sauce'),
(38, 'Spéci szósz', NULL, NULL, '490.00', '', 1, 0, '2026-05-03 14:07:25', 'sauce', 'sauce'),
(39, 'Secret szósz', NULL, NULL, '490.00', '', 1, 0, '2026-05-03 14:07:25', 'sauce', 'sauce'),
(40, 'Coleslaw', NULL, NULL, '550.00', '', 1, 0, '2026-05-03 14:19:57', 'sauce', 'coleslaw');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `token` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- A tábla adatainak kiíratása `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `user_id`, `token`, `expires_at`, `created_at`) VALUES
(109, 2, '3a915af0a9e2a070e6a8e93dcf7948a93567801ffd4a1a4d6273fde7a70aa887', '2026-05-12 14:10:23', '2026-05-03 11:03:59');

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
  `email` varchar(255) NOT NULL,
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

INSERT INTO `reservations` (`id`, `table_number`, `reservation_date`, `reservation_time`, `end_time`, `name`, `email`, `phone`, `people_count`, `note`, `user_id`, `status`, `created_at`) VALUES
(1, 4, '2026-04-12', '13:00:00', '14:00:00', 'Bédy Viktor', '', '06203651451', 10, NULL, NULL, 'cancelled', '2025-11-21 12:25:59'),
(2, 4, '2026-04-12', '13:00:00', '14:00:00', 'Bédy Viktor O', '', '06204651451', 10, NULL, NULL, 'cancelled', '2025-11-21 14:32:03'),
(3, 4, '2026-04-12', '13:00:00', '14:00:00', 'BEDY VIKTOR OLIVER', '', '06 20 514 9495', 10, NULL, NULL, 'cancelled', '2025-11-25 19:58:23'),
(4, 4, '2026-04-12', '13:00:00', '14:00:00', 'Viktor Bédy', '', '333', 10, NULL, 2, 'cancelled', '2025-11-26 09:57:10'),
(5, 4, '2026-04-12', '13:00:00', '14:00:00', 'Viktor Bédy', '', '33333', 10, NULL, 2, 'cancelled', '2025-11-26 11:14:22'),
(6, 4, '2026-04-12', '13:00:00', '14:00:00', 'Viktor Bédy', '', '33333', 10, NULL, 2, 'cancelled', '2025-11-28 17:53:50'),
(7, 4, '2026-04-12', '13:00:00', '14:00:00', 'Bédy Viktor', '', '06203651451', 10, NULL, 2, 'cancelled', '2025-12-01 15:43:35'),
(8, 4, '2026-04-12', '13:00:00', '14:00:00', 'vdkr', 'teszt@teszt.com', '3333', 10, NULL, 2, 'cancelled', '2025-12-01 16:09:19'),
(9, 4, '2026-04-12', '13:00:00', '14:00:00', 'Bédy Viktor', 'bedyviktor2@gmail.com', '06203651451', 10, NULL, 2, 'cancelled', '2025-12-01 16:19:37'),
(10, 4, '2026-04-12', '13:00:00', '14:00:00', 'Bédy Viktor', 'laminaltpadlottv@gmail.com', '06203651451', 10, NULL, 2, 'cancelled', '2025-12-01 17:53:57'),
(11, 4, '2026-04-12', '13:00:00', '14:00:00', 'Bédy Viktor', 'bedyviktor2@gmail.com', '06203651451', 10, NULL, 2, 'cancelled', '2025-12-01 18:22:17'),
(12, 4, '2026-04-12', '13:00:00', '14:00:00', 'Bédy Viktor', 'laminaltpadlottv@gmail.com', '06203651451', 10, NULL, 2, 'cancelled', '2025-12-01 18:29:48'),
(13, 4, '2026-04-12', '13:00:00', '14:00:00', 'Bédy Viktor', 'laminaltpadlottv@gmail.com', '06203651451', 10, NULL, 2, 'cancelled', '2025-12-02 11:14:34'),
(14, 4, '2026-04-12', '13:00:00', '14:00:00', 'Bédy Viktor', 'laminaltpadlottv@gmail.com', '06203651451', 10, NULL, 6, 'cancelled', '2025-12-02 22:24:53'),
(15, 4, '2026-04-12', '13:00:00', '14:00:00', 'Bédy Viktor', 'laminaltpadlottv@gmail.com', '06203651451', 10, NULL, 2, 'cancelled', '2025-12-02 23:11:11'),
(16, 4, '2026-04-12', '13:00:00', '14:00:00', 'Bédy Viktor', 'laminaltpadlottv@gmail.com', '06203651451', 10, NULL, 2, 'cancelled', '2025-12-04 10:53:21'),
(17, 4, '2026-04-12', '13:00:00', '14:00:00', 'Bédy Viktor', 'laminaltpadlottv@gmail.com', '06203651451', 10, NULL, 2, 'cancelled', '2025-12-04 19:00:35'),
(18, 4, '2026-04-12', '13:00:00', '14:00:00', 'Horváth Olivér', 'oliver180903@gmail.com', '06204042404', 10, NULL, 8, 'cancelled', '2025-12-16 10:14:30'),
(19, 4, '2026-04-12', '13:00:00', '14:00:00', 'Bédy Viktor', 'laminaltpadlottv@gmail.com', '06203651451', 10, NULL, 2, 'cancelled', '2025-12-16 13:06:00'),
(20, 4, '2026-04-12', '13:00:00', '14:00:00', 'T Levi', 'bedyviktor2@gmail.com', '06203651451', 10, NULL, NULL, 'cancelled', '2026-01-16 12:35:59'),
(21, 4, '2026-04-12', '13:00:00', '14:00:00', 'Bédy Viktor', 'laminaltpadlottv@gmail.com', '06203651451', 10, NULL, NULL, 'cancelled', '2026-04-11 17:06:12'),
(22, 4, '2026-04-12', '13:00:00', '14:00:00', 'Bédy Viktor', 'laminaltpadlottv@gmail.com', '06203651451', 10, NULL, NULL, 'cancelled', '2026-04-11 17:12:09'),
(23, 4, '2026-04-12', '13:00:00', '14:00:00', 'Bédy Viktor', 'laminaltpadlottv@gmail.com', '06203651451', 10, NULL, NULL, 'cancelled', '2026-04-11 19:21:38'),
(24, 4, '2026-04-12', '13:00:00', '14:00:00', 'Bédy Viktor', 'laminaltpadlottv@gmail.com', '06203651451', 10, NULL, 2, 'cancelled', '2026-04-11 22:00:04');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `toppings`
--

CREATE TABLE `toppings` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(120) NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `image_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- A tábla adatainak kiíratása `toppings`
--

INSERT INTO `toppings` (`id`, `name`, `price`, `image_url`, `is_active`, `sort_order`, `created_at`) VALUES
(1, 'Extra jalapeno', '400.00', NULL, 1, 1, '2026-05-03 14:07:25'),
(2, 'Extra habanero', '400.00', NULL, 1, 2, '2026-05-03 14:07:25'),
(3, 'Extra bacon', '500.00', NULL, 1, 3, '2026-05-03 14:07:25'),
(4, 'Extra sajt', '500.00', NULL, 1, 4, '2026-05-03 14:07:25'),
(5, 'Extra coleslaw', '550.00', NULL, 1, 5, '2026-05-03 14:07:25'),
(6, 'Camembert', '900.00', NULL, 1, 6, '2026-05-03 14:07:25'),
(7, 'Gluténmentes buci', '990.00', NULL, 1, 7, '2026-05-03 14:07:25');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT '0',
  `is_delivery` tinyint(1) NOT NULL DEFAULT '0',
  `name` varchar(100) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- A tábla adatainak kiíratása `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `is_admin`, `is_delivery`, `name`, `created_at`) VALUES
(1, 'teszt@example.com', '$2b$10$2MO2DTj3Rl0Dw1wOupmJNOc872VA1ZwKZool41KTYS3EG4bcLgXka', 0, 0, 'Teszt Elek', '2025-11-13 22:31:33'),
(2, 'laminaltpadlottv@gmail.com', '$2b$10$g7JhyZavzBTS59FbIeoxVeqgUKeiw5HXyyfefLvn2nDxSh9EYkOCS', 1, 1, 'Bédy Viktor', '2025-11-13 22:42:49'),
(3, 'orcshaman13@gmail.com', '$2b$10$ON1R912ppRzAVJ.F4LQ39.T1Q306dmBENNvGTjinC0JJzrfhs9oXu', 0, 0, 'Viktor Bédy', '2025-11-14 10:26:57'),
(4, 'laminaltpadlott@gmail.com', '$2b$10$C1nKiGyPT17l7oMQjo6ZEu9s/X1Q4jKh21AUKb8QwqoTGPD0eAR9W', 0, 0, 'Bédy Viktor', '2025-11-20 20:52:34'),
(5, 'laminaltpadlot@gmail.com', '$2b$10$SO.o/i9YUzp2Nevi73gGg.sFSG21T0NW/qFTU2LgyedSMyKE8qL6m', 0, 0, 'Bédy Viktor', '2025-11-20 21:03:26'),
(6, 'bedyviktor2@gmail.com', '$2b$10$2ZmPsLENMTA/.DbF0ncja.IXG8I2fLOW2x9kQIXc41fR53f4QvM6e', 0, 0, 'Bédy Viktor', '2025-11-26 19:50:56'),
(7, 'laminaltpadlottvv@gmail.com', '$2b$10$JWJzAfOnn.pgbArTpm8QL.J7.bvgS3mVI3gg0cD4jRGs4sstWhtAO', 0, 0, 'Bédy Viktor', '2025-12-03 11:28:51'),
(8, 'oliver180903@gmail.com', '$2b$10$n8AK2Zmq7taoXgMyewMevuiajYD5Az.N0PFWDiaEGJgtPLYEstTEO', 0, 0, 'Horváth Olivér', '2025-12-16 10:01:00'),
(9, 'asdasdas@gmail.com', '$2b$10$qRuZN.cqZJzxc75goI74zenOhhGvJoBAjKb05Sp53.OXAsnV9hdGO', 0, 0, 'Bédy Viktor', '2026-02-27 10:50:30'),
(10, 'adsadasdasd@gmail.com', '$2b$10$25iXwWBb6KMywGRNE8yJj.tRB1VRGQWRyxrTp23O1fD0vPKjCnmJ2', 0, 0, 'Bédy Viktor', '2026-03-03 13:49:44');

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `admin_audit_logs`
--
ALTER TABLE `admin_audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admin_user` (`admin_user_id`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`);

--
-- A tábla indexei `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_user_product_config` (`user_id`,`product_id`,`config_key`),
  ADD KEY `fk_cart_product` (`product_id`);

--
-- A tábla indexei `delivery_zones`
--
ALTER TABLE `delivery_zones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_delivery_zones_city` (`city`),
  ADD KEY `idx_delivery_zones_active_sort` (`is_active`,`sort_order`);

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
-- A tábla indexei `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_refresh_token_token` (`token`),
  ADD KEY `idx_refresh_token_user` (`user_id`);

--
-- A tábla indexei `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `toppings`
--
ALTER TABLE `toppings`
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
-- AUTO_INCREMENT a táblához `admin_audit_logs`
--
ALTER TABLE `admin_audit_logs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=76;

--
-- AUTO_INCREMENT a táblához `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT a táblához `delivery_zones`
--
ALTER TABLE `delivery_zones`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT a táblához `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT a táblához `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT a táblához `products`
--
ALTER TABLE `products`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT a táblához `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=110;

--
-- AUTO_INCREMENT a táblához `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT a táblához `toppings`
--
ALTER TABLE `toppings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT a táblához `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `admin_audit_logs`
--
ALTER TABLE `admin_audit_logs`
  ADD CONSTRAINT `fk_admin_user` FOREIGN KEY (`admin_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

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

--
-- Megkötések a táblához `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
