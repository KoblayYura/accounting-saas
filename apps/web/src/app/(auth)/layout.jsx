// (auth)/layout.jsx — публічні маршрути авторизації.
// Відновлення сесії робить AuthProvider (глобально в root layout), тут — просто passthrough.

export default function AuthGroupLayout({ children }) {
  return children;
}
