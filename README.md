````md
# Trabajo Integrador Final – Integral MAQ

Sistema de gestión desarrollado como **Trabajo Integrador Final**, orientado a la administración de reparaciones, presupuestos, facturación y cobros para la empresa **Integral MAQ**.

El proyecto está compuesto por:
- **Backend:** Laravel (API REST)
- **Frontend:** Angular (Aplicación web)

Ambos se ejecutan de forma independiente y se comunican mediante HTTP.

---

## 👥 Integrantes
- Pignataro, Nahuel  
- Federik, Juan Cruz  
- Passarella, Fátima  

---

## 🛠️ Tecnologías utilizadas

### Backend
- PHP
- Laravel
- Composer
- MySQL

### Frontend
- Angular
- Node.js
- npm
- Angular CLI

### Entorno recomendado
- XAMPP o Laragon
- Git

> ⚠️ El proyecto fue desarrollado y probado **exclusivamente en entorno local** usando XAMPP / Laragon.

---

## ⚙️ Requisitos previos

Antes de comenzar, asegurarse de tener instalado:

- Git
- XAMPP o Laragon
- PHP compatible con Laravel
- Composer
- Node.js
- Angular CLI
- MySQL
- 7-Zip (en caso de problemas al descomprimir)

Además, verificar que los servicios **Apache** y **MySQL** estén en ejecución.

---

## 📥 Clonar el repositorio

```bash
git clone https://github.com/jcfederik/trabajo-integrador-final
cd trabajo-integrador-final
````

---

## 🔧 Instalación del Backend (Laravel)

> 📁 Ingresar a la carpeta donde se encuentre el **backend Laravel**
> (por ejemplo: `backend/`)

```bash
cd backend
```

### 1. Instalar dependencias

```bash
composer install
```

En algunos entornos (XAMPP / Laragon) `composer install` puede fallar por conflictos de dependencias.
Si esto ocurre, ejecutar:

```bash
composer update
```

---

### 2. Configurar archivo `.env`

Copiar el archivo de ejemplo:

```bash
cp .env.example .env
```

Ejemplo de configuración utilizada durante el desarrollo:

```env
APP_NAME=Laravel
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=TRABAJO-INTEGRADOR
DB_USERNAME=root
DB_PASSWORD=
```

---

### 3. Crear la base de datos

Desde phpMyAdmin o MySQL crear una base de datos llamada:

```
TRABAJO-INTEGRADOR
```

(No es necesario crear tablas manualmente).

---

### 4. Generar la clave de la aplicación

```bash
php artisan key:generate
```

---

### 5. Ejecutar migraciones y seeders

⚠️ **Paso fundamental**

```bash
php artisan migrate --seed
```

Este comando:

* Crea todas las tablas
* Inserta datos iniciales
* Genera los usuarios del sistema

---

### 6. Levantar el servidor backend

```bash
php artisan serve
```

El backend quedará disponible en:

```
http://127.0.0.1:8000
```

---

## 🔐 Credenciales de acceso (usuarios de prueba)

Los usuarios se crean automáticamente mediante los **seeders**.

### Administrador

* **Usuario:** admin
* **Contraseña:** admin123

### Técnicos

* **Usuario:** tecnico1 — **Contraseña:** tecnico123
* **Usuario:** tecnico2 — **Contraseña:** tecnico123

### Usuario estándar

* **Usuario:** usuario1 — **Contraseña:** user123

---

## 🎨 Instalación del Frontend (Angular)

> 📁 Ingresar a la carpeta donde se encuentre el **frontend Angular**
> (por ejemplo: `frontend/`)

```bash
cd frontend
```

### 1. Instalar dependencias

```bash
npm install
```

---

### 2. Levantar el servidor frontend

```bash
ng serve
```

La aplicación estará disponible en:

```
http://localhost:4200
```

---

## 🔄 Comunicación Frontend – Backend

El frontend consume la API REST expuesta por Laravel en:

```
http://127.0.0.1:8000/api
```

No se requiere configuración adicional de CORS en entorno local.

---

## ✅ Verificación del sistema

1. Levantar backend (`php artisan serve`)
2. Levantar frontend (`ng serve`)
3. Acceder a `http://localhost:4200`
4. Iniciar sesión con el usuario administrador
5. Verificar navegación y funcionamiento general

---

## 🧪 Comandos utilizados (resumen)

```bash
# Clonar repositorio
git clone https://github.com/jcfederik/trabajo-integrador-final

# Backend
cd backend
composer install || composer update
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve

# Frontend
cd frontend
npm install
ng serve
```

---

## 📌 Observaciones finales

* El proyecto está pensado para **uso académico**
* Se recomienda **no cambiar la configuración del .env**
* Ante errores de dependencias, volver a ejecutar `composer update` o `npm install`

---
