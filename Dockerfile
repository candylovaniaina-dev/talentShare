
FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
        postgresql-dev libzip-dev oniguruma-dev icu-dev \
        libpng-dev libjpeg-turbo-dev freetype-dev \
        $PHPIZE_DEPS \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo pdo_pgsql zip mbstring intl opcache gd bcmath

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN { \
      echo "opcache.enable=1"; \
      echo "opcache.enable_cli=1"; \
      echo "opcache.validate_timestamps=1"; \
      echo "opcache.revalidate_freq=2"; \
      echo "opcache.memory_consumption=192"; \
      echo "opcache.max_accelerated_files=20000"; \
      echo "realpath_cache_size=4096K"; \
      echo "realpath_cache_ttl=600"; \
    } > /usr/local/etc/php/conf.d/opcache-dev.ini

WORKDIR /var/www/html

COPY composer.json composer.lock* ./
RUN composer install --no-scripts --no-autoloader --prefer-dist

COPY . .
RUN composer dump-autoload --optimize || true

EXPOSE 8001
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8001"]
