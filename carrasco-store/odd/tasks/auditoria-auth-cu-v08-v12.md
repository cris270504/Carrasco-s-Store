# Auditoría de autenticación: CU-V08 a CU-V12

## Objetivo
Atender las auditorías pendientes de `docs/Bitacora-Auditoria-Casos-de-Uso.docx`
(CU-V08 registro, CU-V09 login, CU-V10 recuperación, CU-V11 restablecer, CU-V12 WhatsApp).

## Decisiones del usuario (respuestas explícitas)
- Contraseña: **mínimo 8 con mayúscula, minúscula, número y símbolo**.
- Aplicada **en pantalla y en Supabase Auth** (política de contraseña vía Management API).
- Correo ya registrado: **decir que ya está registrado**, con enlace a iniciar sesión.
  Esto revierte la generalización de seguridad que había antes (ver nota en el reporte).
- Tras registrarse: **redirigir de inmediato a /login** con el aviso "Revisa tu correo".
- CU-V10 y CU-V12: los detalles son copias erróneas → **OK sin cambios**.

## Alcance
- CU-V08: botón de ojo en contraseña, regla nueva, correo duplicado explícito, aviso + redirección.
- CU-V09: botón de ojo en contraseña de login.
- CU-V11: misma regla de contraseña que CU-V08.
- Supabase Auth: `password_min_length` = 8 y requisitos de caracteres (solo esos campos).

## Tareas
- [x] T1 `shared/utils/password.ts`: reglas de contraseña (una sola fuente para cliente).
- [x] T2 `app/components/PasswordInput.vue`: input con botón de ojo (reutilizado en registro y login).
- [x] T3 `register.vue`: regla nueva, correo duplicado explícito, redirección a /login con aviso.
- [x] T4 `login.vue`: botón de ojo y aviso "Revisa tu correo" desde el registro.
- [x] T5 `restablecer-password.vue`: regla nueva.
- [~] T6 Supabase Auth: `password_min_length` = 8 aplicado y verificado por GET. PARCIAL: `password_required_characters` rechazado por el API (400) con las variantes probadas; pendiente decisión del usuario.
- [x] T7 Verificación: typecheck, build, pruebas en navegador SIN enviar registros (ver nota).
- [ ] T8 Bitácora `.docx` actualizada: CU-V08/09/11 corregidos; CU-V10/12 OK. BLOQUEADO: Word tiene el archivo abierto (`~$tacora-…docx`); el usuario debe cerrarlo.
- [ ] T9 Commit + push del código (sin el .docx). Pendiente del .docx: ver T8.

## Verificación y límites
- No se envía ningún registro real: la base de Supabase es la de producción y crear cuentas de prueba
  no está permitido en esta sesión. La rama de correo duplicado se valida por código y por el
  comportamiento documentado de `signUp`, no con una cuenta real.
- Sin credenciales de admin: no se prueba `/admin`.
