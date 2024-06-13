document.addEventListener('DOMContentLoaded', () => {
    let editingProductId = null;

    const productTableBody = document.querySelector('#product-table tbody');

    const fetchProducts = async () => {
        try {
            const response = await fetch('http://localhost:5000/obtener_productos');
            const products = await response.json();
            displayProducts(products);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchImages = async (productId) => {
        try {
            const response = await fetch(`http://localhost:5000/obtener_todas_imagen?id_producto=${productId}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching images:', error);
            return [];
        }
    };

    const displayProducts = async (products) => {
        productTableBody.innerHTML = '';
        for (const product of products) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id_producto}</td>
                <td>${product.nombre}</td>
                <td>${product.descripcion}</td>
                <td>${product.precio}</td>
                <td>${product.validacion ? 'Verdadero' : 'Falso'}</td>
                <td>
                    <div id="carousel-${product.id_producto}" class="carousel-container">
                        <div id="carousel-inner-${product.id_producto}" class="carousel-inner"></div>
                        <div class="carousel-buttons">
                            <button onclick="prevSlide(${product.id_producto})">&lt;</button>
                            <button onclick="nextSlide(${product.id_producto})">&gt;</button>
                        </div>
                    </div>
                </td>
                <td class="actions">
                    <button class="btn btn-sm btn-warning" onclick="toggleEditProduct(${product.id_producto}, this)">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id_producto})">Eliminar</button>
                </td>
                
            `;
            productTableBody.appendChild(row);
            const images = await fetchImages(product.id_producto);
            displayImages(product.id_producto, images);
        }
    };

    const displayImages = (productId, images) => {
        const carouselInner = document.getElementById(`carousel-inner-${productId}`);
        carouselInner.innerHTML = '';

        images.forEach((image, index) => {
            const div = document.createElement('div');
            div.classList.add('carousel-item');
            if (index === 0) {
                div.classList.add('active');
            }
            div.innerHTML = `<img src="http://localhost:5000/foto/${image.url_imagen}" class="d-block w-100" alt="...">`;
            carouselInner.appendChild(div);
        });
    };

    window.prevSlide = (productId) => {
        $(`#carousel-${productId}`).carousel('prev');
    };

    window.nextSlide = (productId) => {
        $(`#carousel-${productId}`).carousel('next');
    };

    window.toggleEditProduct = (id, button) => {
        console.log('Id:', id);
        console.log('Button:', button);
        if (id === editingProductId) {
            // Si el producto ya está en modo de edición, desactivar la edición
            editingProductId = null;
            button.textContent = 'Editar';
            button.classList.remove('active');
            // Restablecer la edición de la celda de validación
            const row = button.closest('tr');
            const cells = row.children;
            cells[4].textContent = cells[4].dataset.value === 'true' ? 'Verdadero' : 'Falso';
        } else {
            // Si otro producto ya está en modo de edición, desactivar su edición primero
            const activeEditButton = document.querySelector('.actions button.active');
            console.log("activacion de btn",activeEditButton)
            if (activeEditButton) {
                activeEditButton.textContent = 'Editar';
                activeEditButton.classList.remove('active');
                // Restablecer la edición de la celda de validación del producto anterior
                const activeRow = activeEditButton.closest('tr');
                const activeCells = activeRow.children;
                activeCells[4].textContent = activeCells[4].dataset.value === 'true' ? 'Verdadero' : 'Falso';
                // Eliminar el evento onclick del botón "Guardar" del producto anterior
                activeEditButton.removeEventListener('click', () => saveProduct(activeRow.dataset.productId, activeEditButton));
            }
    
            // Activar la edición del nuevo producto
            editingProductId = id;
            button.textContent = 'Guardar';
            button.classList.add('active');
            // Permitir la edición de la celda de validación
            const row = button.closest('tr');
            console.log(editingProductId)
            console.log(row)
            const cells = row.children;
            console.log(cells)
            cells[4].innerHTML = `
                <select id="edit-validacion-${id}">
                    <option value="true" ${cells[4].textContent === 'Verdadero' ? 'selected' : ''}>Verdadero</option>
                    <option value="false" ${cells[4].textContent === 'Falso' ? 'selected' : ''}>Falso</option>
                </select>
            `;
            console.log(cells)
            // Ahora, accedemos al elemento select dentro de cells[4]
            const selectElement = document.getElementById(`edit-validacion-${id}`);
            console.log("valor seleccionado",selectElement)
            // Verificamos si selectElement es null antes de continuar
            if (selectElement) {
                // Agregar el evento para guardar el producto al presionar "Guardar"
                button.addEventListener('click', () => saveProduct(id, button, selectElement));
            } else {
                console.error('No se pudo encontrar el elemento select');
            }
        }
    };

    const saveProduct = async (id, button, selectElement) => {
        const row = button.closest('tr');
        const cells = row.children;
        console.log('button:', button);
        console.log('id:', id);
        console.log('row:', row);
        console.log('Cells:', cells[1]);
        console.log('Cells:', cells[2]);
        console.log('Cells:', cells[3]);
        const validationValue = selectElement.options[selectElement.selectedIndex].value;
        console.log(validationValue);
        const product = {
            id_producto: id,
            nombre: cells[1].textContent,
            descripcion: cells[2].textContent,
            precio: cells[3].textContent,
            validacion: validationValue === 'true' 
        };
        console.log('Product:', product);
    
        try {
            const response = await fetch(`http://localhost:5000/producto/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
    
            if (!response.ok) throw new Error('Failed to save product');
    
            // Si la actualización fue exitosa, mostrar una alerta
            alert('El producto se ha actualizado correctamente.');
    
            // Recargar la página
            location.reload();
        } catch (error) {
            console.error('Error saving product:', error);
        }
    };

    window.deleteProduct = async (id) => {
        // Mostrar un cuadro de diálogo de confirmación al usuario
        const confirmed = confirm('¿Estás seguro de que quieres eliminar este producto?');
    
        // Verificar si el usuario confirmó la eliminación
        if (confirmed) {
            try {
                const response = await fetch(`http://localhost:5000/Eliminarproducto/${id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error('Failed to delete product');
                fetchProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        } else {
            console.log('Eliminación cancelada por el usuario');
        }
    };

    fetchProducts(); // Fetch products when the page loads
});