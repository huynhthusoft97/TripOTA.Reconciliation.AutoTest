import { Configuration, IdentityApi } from '../sdk/index.js';
import { env } from './env.js';

/**
 * Đăng nhập BE (identity) lấy accessToken (JWT) cho các API cần bearerAuth.
 * Endpoint: POST /api/v1/identity/authentication/login  ({ userName, password } → { accessToken }).
 */
export async function getAccessToken(): Promise<string> {
  if (!env.user || !env.password) {
    throw new Error(
      `Thiếu TEST_USER / TEST_PASSWORD cho môi trường "${env.name}" — đặt trong .env.${env.name}.`,
    );
  }
  const identity = new IdentityApi(new Configuration({ basePath: env.apiBaseUrl }));
  const res = await identity.apiV1IdentityAuthenticationLoginPost({
    userName: env.user,
    password: env.password,
  });
  const token = res.data?.accessToken;
  if (!token) throw new Error('Login không trả accessToken');
  return token;
}

/** Configuration đã gắn bearer token — dùng khởi tạo các *Api của SDK cho API cần auth. */
export async function authConfig(): Promise<Configuration> {
  return new Configuration({ basePath: env.apiBaseUrl, accessToken: await getAccessToken() });
}
