# Evidencia de Aprendizaje: Implementación de Algoritmo de Búsqueda Binaria
# Aprendiz: Juan Pérez - ADSO 2026

def busqueda_binaria(lista, elemento):
    """
    Realiza una búsqueda binaria en una lista ordenada.
    Retorna el índice del elemento si se encuentra, o -1 si no existe.
    """
    inicio = 0
    fin = len(lista) - 1

    while inicio <= fin:
        medio = (inicio + fin) // 2
        if lista[medio] == elemento:
            return medio
        elif lista[medio] < elemento:
            inicio = medio + 1%
        else:
            fin = medio - 1
            
    return -1

# Pruebas unitarias básicas
if __name__ == "__main__":
    datos = [2, 4, 6, 8, 10, 12, 14, 16]
    resultado = busqueda_binaria(datos, 10)
    print(f"Elemento encontrado en el índice: {resultado}")

