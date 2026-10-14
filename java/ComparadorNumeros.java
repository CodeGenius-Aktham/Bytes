import java.util.Scanner;

/**
 * Comparador de números: pide dos números por teclado e indica
 * cuál es el mayor y cuál es el menor (o si son iguales).
 */
public class ComparadorNumeros {

    public static void main(String[] args) {
        Scanner teclado = new Scanner(System.in);

        System.out.println("=== Comparador de números ===");
        double primero = leerNumero(teclado, "Ingresa el primer número: ");
        double segundo = leerNumero(teclado, "Ingresa el segundo número: ");

        if (primero > segundo) {
            System.out.println("El mayor es: " + formatear(primero));
            System.out.println("El menor es: " + formatear(segundo));
        } else if (segundo > primero) {
            System.out.println("El mayor es: " + formatear(segundo));
            System.out.println("El menor es: " + formatear(primero));
        } else {
            System.out.println("Los dos números son iguales: " + formatear(primero));
        }

        teclado.close();
    }

    /** Pide un número hasta que el usuario escriba uno válido. */
    private static double leerNumero(Scanner teclado, String mensaje) {
        while (true) {
            System.out.print(mensaje);
            // Se acepta tanto 2.5 como 2,5 sin importar el idioma del sistema
            String entrada = teclado.nextLine().trim().replace(',', '.');
            try {
                return Double.parseDouble(entrada);
            } catch (NumberFormatException e) {
                System.out.println("Eso no es un número válido, inténtalo de nuevo.");
            }
        }
    }

    /** Muestra 5 en vez de 5.0 cuando el número es entero. */
    private static String formatear(double numero) {
        if (numero == Math.rint(numero) && !Double.isInfinite(numero)) {
            return String.valueOf((long) numero);
        }
        return String.valueOf(numero);
    }
}
