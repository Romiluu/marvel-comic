// Configuracion de la API
const apiUrl = "https://gateway.marvel.com/v1/public/";
const publicKey = "10f5836a64fa9ea27bf6fb9cbf41e826";
const privateKey = "c3859b369c4d5d8bb057b8d15b2058ec31f0db25";
const ts = "marvelromilu";
const hash = "3625cd0f9789029f5d8d27b459b86464";

const $ = (query) => document.querySelector(query);
const $$ = (query) => document.querySelectorAll(query);

let offset = 0;
let totalResults = 0;
let pageLimit = 20;

// Selección de botones de paginación
const btnFirst = $("#first-page");
const btnPrevious = $("#previous-page");
const btnNext = $("#next-page");
const btnLast = $("#last-page");


//Función que conecta con la API
const fetchURL = async (url) => {
    console.log("Fetching URL:", url); // Imprime la URL para depuración
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`); // Log de error detallado
            throw new Error('Error en la respuesta de la API');
        }
        const data = await response.json();
        return data; 
    } catch (error) {
        console.error('Error al realizar la petición:', error);
        return null; // Devuelve null o algún valor predeterminado en caso de error
    }
};

// construye y devuelve una URL para hacer una solicitud a la API de Marvel, dependiendo si es comic o personajes
const getApiURL = (resource) => {
    const sortDropdown = $('#sort-order');
    const searchInput = $('#input-search');

    let searchParams = `?apikey=${publicKey}&ts=${ts}&hash=${hash}&offset=${offset}`;

    if (resource === 'comics') {
        searchParams += `&orderBy=${sortDropdown.value}`;
        if (searchInput.value.length) {
            searchParams += `&titleStartsWith=${searchInput.value}`;
        }
    } else if (resource === 'characters') {
        if (searchInput.value.length) {
            searchParams += `&nameStartsWith=${searchInput.value}`;
        }
    }

    return `${apiUrl}${resource}${searchParams}`;
};


// determina el tipo de búsqueda
const search = async () => {
    clearResults();
    const type = $('#marvel-select').value;

    let data; // Inicializa data fuera de la estructura condicional
    let searchParams = `?apikey=${publicKey}&ts=${ts}&hash=${hash}&offset=${offset}`;

    if (type === 'COMICS') {
        const sortDropdown = $('#sort-order');
        const searchInput = $('#input-search');

        searchParams += `&orderBy=${sortDropdown.value}`;

        if (searchInput.value.length) {
            searchParams += `&titleStartsWith=${searchInput.value}`;
        }

        data = await fetchURL(`${apiUrl}comics${searchParams}`);
        console.log(data); // Imprime la respuesta de la API
        if (data) {
            appendComics(data.data.results);
            updateResultsCount(data.data.total);
        } else {
            console.error('No se pudieron obtener cómics.');
        }
    } else if (type === 'PERSONAJES') {
        const searchInput = $('#input-search');

        if (searchInput.value.length) {
            searchParams += `&nameStartsWith=${searchInput.value}`;
        }

        data = await fetchURL(`${apiUrl}characters${searchParams}`);
        console.log(data); // Imprime la respuesta de la API
        if (data) {
            appendCharacters(data.data.results);
            updateResultsCount(data.data.total);
        } else {
            console.error('No se pudieron obtener personajes.');
        }
    }
    updatePaginationButtons();  
};;

//Función que muestra las tarjetas de los cómics
const appendComics = (comics) => {
    const resultsContainer = $('.results');
    resultsContainer.innerHTML = ''; // Limpiar resultados anteriores
    if (comics.length === 0) {
        resultsContainer.innerHTML = '<h2 class="no-results text-red-600">No se han encontrado resultados</h2>';
        return;
    }

    comics.forEach((comic) => {
        const comicCard = document.createElement('div');
        comicCard.classList.add('bg-white', 'rounded-lg', 'shadow-lg', 'p-4', 'w-64', 'transition-transform',  'duration-300', 'transform', 'hover:scale-105', 'hover:shadow-2xl'); // Ajusta el tamaño según el viewport
        comicCard.innerHTML = `
            <div class="bg-gray-200 p-2 rounded-t-lg">
                <img src="${comic.thumbnail.path}/portrait_uncanny.${comic.thumbnail.extension}" alt="${comic.title}" class="w-full h-72 object-fit rounded-lg" />
            </div>
            <h3 class="text-center text-md font-bold mt-2">${comic.title}</h3>
        `;
        resultsContainer.append(comicCard);
    });
};;

// Función que muestra las tarjetas de los personajes
const appendCharacters = (characters) => {
    const resultsContainer = $('.results');
    resultsContainer.innerHTML = ''; // Limpiar resultados anteriores
  
    if (characters.length === 0) {
      resultsContainer.innerHTML = '<h2 class="no-results text-red-600">No se han encontrado resultados</h2>';
      return;
    }
  
    for (const character of characters) {
      const characterCard = document.createElement('div');
      characterCard.tabIndex = 0;
      characterCard.classList.add('character', 'bg-white', 'rounded-lg', 'shadow-lg', 'p-4', 'w-64', 'transition-transform', 'duration-300', 'transform', 'hover:scale-105', 'hover:shadow-2xl');
  
      characterCard.innerHTML = `
        <div class="character-img-container bg-gray-200 p-2 rounded-t-lg">
          <img src="${character.thumbnail.path}/portrait_uncanny.${character.thumbnail.extension}" alt="${character.name}" class="w-full h-72 object-fit rounded-lg" />
        </div>
        <div class="character-name-container text-center mt-2">
          <h3 class="character-name text-md font-bold">${character.name}</h3>
        </div>
      `;
  
      resultsContainer.append(characterCard);
    }
  };

// Limpia los resultados previamente mostrados en el contenedor de resultados.
const clearResults = () => {
    const resultsContainer = $('.results');
    resultsContainer.innerHTML = '';
};
//Actualiza la visualización del número de resultados encontrados.
const updateResultsCount = (count) => {
    $('.results-number').innerHTML = count;
    totalResults = count;
};
  
// Añadir el evento al botón de búsqueda
$('#btn-search').onclick = () => {
    search();
};

// Función para habilitar o deshabilitar los botones de paginación
function updatePaginationButtons() {
    const maxOffset = Math.floor((totalResults - 1) / pageLimit) * pageLimit;
    
    // Deshabilita el botón de la primera página si ya estamos en la primera página
    btnFirst.disabled = (offset === 0);
    btnPrevious.disabled = (offset === 0);
    
    // Deshabilita el botón de la última página si ya estamos en la última página
    btnNext.disabled = (offset >= maxOffset);
    btnLast.disabled = (offset >= maxOffset);
}


// Función para habilitar o deshabilitar los botones de paginación
function updatePaginationButtons() {
    const maxOffset = Math.floor((totalResults - 1) / pageLimit) * pageLimit;
    
    // Deshabilita el botón de la primera página si ya estamos en la primera página
    btnFirst.disabled = (offset === 0);
    btnPrevious.disabled = (offset === 0);
    
    // Deshabilita el botón de la última página si ya estamos en la última página
    btnNext.disabled = (offset >= maxOffset);
    btnLast.disabled = (offset >= maxOffset);
}

// Botones de paginación
btnFirst.addEventListener("click", () => {
    offset = 0;  // Asegúrate de usar 'offset' correctamente
    search(); // Vuelve a buscar con el nuevo offset
});

btnPrevious.addEventListener("click", () => {
    if (offset > 0) {
        offset -= pageLimit; // Disminuye el offset
        search(); // Vuelve a buscar
    }
});

btnNext.addEventListener("click", () => {
    const maxOffset = Math.floor((totalResults - 1) / pageLimit) * pageLimit;
    if (offset < maxOffset) {
        offset += pageLimit; // Aumenta el offset
        search(); // Vuelve a buscar
    }
});

btnLast.addEventListener("click", () => {
    const maxOffset = Math.floor((totalResults - 1) / pageLimit) * pageLimit;
    offset = maxOffset; // Establece el offset en el máximo valor
    search(); // Vuelve a buscar
});
  
//carga al iniciar
document.addEventListener('DOMContentLoaded', async () => {
    $('#marvel-select').value = 'COMICS'; 
    await search(); // Llama a la función de búsqueda para cargar cómics
});
  