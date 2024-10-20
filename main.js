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

//almacenar y gestionar parámetros de búsqueda
let lastSearchParams = {
    type: '',
    searchText: '',
    order: '',
    offset: 0,
};


//Función que conecta con la API
const fetchURL = async (url) => {
    console.log("Fetching URL:", url); 
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            throw new Error('Error en la respuesta de la API');
        }
        const data = await response.json();
        return data; 
    } catch (error) {
        console.error('Error al realizar la petición:', error);
        return null; 
    }
};

// construye y devuelve una URL para hacer una solicitud a la API de Marvel, dependiendo si es comic o personajes
const getApiURL = (resource) => {
    const sortDropdown = $('#sort-order');
    const searchInput = $('#input-search');
    let searchParams = `?apikey=${publicKey}&ts=${ts}&hash=${hash}&offset=${offset}`;

    if (resource === 'comics') {
        searchParams += `&orderBy=${sortDropdown.value}`;
        if (searchInput.value.length) searchParams += `&titleStartsWith=${searchInput.value}`;
    } else if (resource === 'characters') {
        if (searchInput.value.length) searchParams += `&nameStartsWith=${searchInput.value}`;
    }

    return `${apiUrl}${resource}${searchParams}`;
};


// determina el tipo de búsqueda
const search = async () => {
    clearResults();
    showLoader(); 
    const type = $('#marvel-select').value;
    lastSearchParams.type = type; 
    const searchInput = $('#input-search').value;
    lastSearchParams.searchText = searchInput; 
    const sortDropdown = $('#sort-order').value;
    lastSearchParams.order = sortDropdown; 

    // Ocultar las secciones de detalles cuando se realiza una nueva búsqueda
    const comicDetailsSection = $('#comic-details');
    const characterDetailsSection = $('#character-details');

    if (comicDetailsSection) {
        comicDetailsSection.classList.add('hidden'); 
    }
    
    if (characterDetailsSection) {
        characterDetailsSection.classList.add('hidden'); 
    }

    let data;
    let searchParams = `?apikey=${publicKey}&ts=${ts}&hash=${hash}&offset=${offset}`;

    if (type === 'COMICS') {
        const sortDropdown = $('#sort-order');
        const searchInput = $('#input-search');

        searchParams += `&orderBy=${sortDropdown.value}`;
        if (searchInput.value.length) {
            searchParams += `&titleStartsWith=${searchInput.value}`;
        }

        data = await fetchURL(`${apiUrl}comics${searchParams}`);
        console.log(data); 
        if (data) {
            appendComics(data.data.results);
            updateResultsCount(data.data.total);
        } else {
            console.error('No se pudieron obtener cómics.');
        }
    } else if (type === 'PERSONAJES') {
        const searchInput = $('#input-search');
        updateResultsTitle(`Resultados`)

        if (searchInput.value.length) {
            searchParams += `&nameStartsWith=${searchInput.value}`;
        }

        data = await fetchURL(`${apiUrl}characters${searchParams}`);
        console.log(data); 
        if (data) {
            appendCharacters(data.data.results);
            updateResultsCount(data.data.total);
            updatePageSelect(Math.ceil(totalResults / pageLimit)); 
        } else {
            console.error('No se pudieron obtener personajes.');
        }
    }
    updateResultsTitle(`Resultados`)
    updatePaginationButtons(); 
    updateTotalPages(); 
    hideLoader(); 
};


//Función que muestra las tarjetas de los cómics
const appendComics = (comics) => {
    showLoader();
    const resultsContainer = $('.results');
    resultsContainer.innerHTML = ''; 
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

        
        comicCard.addEventListener('click', () => showComicDetails(comic.id));
        
        resultsContainer.append(comicCard);
    });
    hideLoader();
};;

// Función que muestra las tarjetas de los personajes
const appendCharacters = (characters) => {
    showLoader();
    const resultsContainer = $('.results'); 
    resultsContainer.classList.remove('hidden'); 
    resultsContainer.innerHTML = ''; 

    if (characters.length === 0) {
        resultsContainer.innerHTML = '<h2 class="no-results text-red-600">No se han encontrado resultados</h2>';
        return;
    }

    characters.forEach((character) => {
        const characterCard = document.createElement('div');
        characterCard.classList.add('bg-white', 'rounded-lg', 'shadow-lg', 'p-4', 'w-64', 'transition-transform', 'duration-300', 'transform', 'hover:scale-105', 'hover:shadow-2xl');
        characterCard.innerHTML = `
            <div class="bg-gray-200 p-2 rounded-t-lg">
                <img src="${character.thumbnail.path}/portrait_uncanny.${character.thumbnail.extension}" alt="${character.name}" class="w-full h-72 object-fit rounded-lg" />
            </div>
            <h3 class="text-lg font-semibold">${character.name}</h3>
        `; 

        
    characterCard.addEventListener('click', () => showCharacterDetails(character.id));

        resultsContainer.appendChild(characterCard);
    });
    hideLoader();
};


//muestra detalles del comic
async function showComicDetails(comicId) {
    showLoader();
    const comic = await fetchComic(comicId);
    if (comic) {
        clearResults();
        updateComicDetails(comic);
        
        // Oculta la sección de detalles del personaje
        const characterDetailsSection = document.getElementById('character-details');
        if (characterDetailsSection) {
            characterDetailsSection.classList.add('hidden'); 
        }
        
        // Muestra los detalles del cómic
        const comicDetailsSection = document.getElementById('comic-details');
        if (comicDetailsSection) {
            comicDetailsSection.classList.remove('hidden');
        }
    } else {
        console.error('No se pudo obtener los detalles del cómic');
    }
    hideLoader();
    backToSearchButton.classList.remove('hidden'); 
}

// Muestra detalles del personaje
async function showCharacterDetails(characterId) {
    showLoader();
    const character = await fetchCharacter(characterId);
    if (character) {
        clearResults();
        updateCharacterDetails(character);
        
        const characterDetailsSection = $('#character-details');
        characterDetailsSection.classList.remove('hidden');

        const comicDetailsSection = $('#comic-details'); 
        comicDetailsSection.classList.add('hidden'); 

        
        fetchRelatedComics(characterId);
    } else {
        console.error('No se pudo obtener los detalles del personaje');
    }
    backToSearchButton.classList.remove('hidden'); 
    hideLoader();
}

// Función para buscar cómics en los que aparece el personaje
const fetchRelatedComics = async (characterId) => {
    showLoader();
    const url = `${apiUrl}characters/${characterId}/comics?apikey=${publicKey}&ts=${ts}&hash=${hash}`;
    const comicsData = await fetchURL(url);

    if (comicsData) {
        appendComics(comicsData.data.results); 
        updateResultsCount(comicsData.data.total);
        updateResultsTitle(`Comics del personaje`);
    }
    hideLoader();
};
// Actualiza los detalles del cómic
function updateComicDetails(comic) {
    // Actualiza los detalles del cómic
    $('#comic-title').innerText = comic.title;
    $('#comic-description').innerText = comic.description || 'Descripción no disponible';
    $('#comic-image').src = `${comic.thumbnail.path}/portrait_uncanny.${comic.thumbnail.extension}`;
    
    // Añadir publicación y guionistas
    $('#comic-publication').innerText = `Publicado: ${comic.dates[0].date}`;
    $('#comic-writers').innerText = `Guionistas: ${comic.creators.items.map(item => item.name).join(', ') || 'No disponible'}`;
    
    // Mostrar detalles
    $('#comic-details').classList.remove('hidden'); 

    
    fetchRelatedCharacters(comic.id);    
}

// Función para buscar personajes relacionados al cómic
const fetchRelatedCharacters = async (comicId) => {
    showLoader();
    const url = `${apiUrl}comics/${comicId}/characters?apikey=${publicKey}&ts=${ts}&hash=${hash}`;
    const charactersData = await fetchURL(url);

    if (charactersData) {
        appendCharacters(charactersData.data.results); 
        updateResultsCount(charactersData.data.total);
        updateResultsTitle(`Personajes del cómic`);
    }
    hideLoader();
};  

// Actualiza los detalles del personaje
function updateCharacterDetails(character) {
    $('#character-name').innerText = character.name;
    $('#character-description').innerText = character.description || 'Descripción no disponible';
    $('#character-image').src = `${character.thumbnail.path}/portrait_uncanny.${character.thumbnail.extension}`;
    $('#character-details').classList.remove('hidden');
}

// Función para obtener los detalles del cómic
async function fetchComic(comicId) {
    try {
        const url = `${apiUrl}comics/${comicId}?apikey=${publicKey}&ts=${ts}&hash=${hash}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Error al obtener los detalles del cómic');
        }
        const data = await response.json();
        return data.data.results[0]; 
    } catch (error) {
        console.error('Hubo un problema con la solicitud: ', error);
    }
}

// Función para obtener los detalles del personaje
async function fetchCharacter(characterId) {
    try {
        const url = `${apiUrl}characters/${characterId}?apikey=${publicKey}&ts=${ts}&hash=${hash}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Error al obtener los detalles del personaje');
        }
        const data = await response.json();
        return data.data.results[0];
    } catch (error) {
        console.error('Hubo un problema con la solicitud:', error);
    }
}

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

//mostar y ocultar el loader
const showLoader = () => {
    const loader = document.querySelector('.custom-container');
    loader.classList.remove('hidden'); 
};

const hideLoader = () => {
    const loader = document.querySelector('.custom-container');
    loader.classList.add('hidden'); 
};
//cambia el titulo de resultados
const updateResultsTitle = (title) => {
    $('.results-title').innerHTML = title
}

const backToSearchButton = $('#back-to-search');
// Agregar evento al botón "Volver"
backToSearchButton.addEventListener('click', async () => {
    if (lastSearchParams.type) {
        $('#marvel-select').value = lastSearchParams.type; 
        $('#input-search').value = lastSearchParams.searchText; 
        $('#sort-order').value = lastSearchParams.order; 
        offset = lastSearchParams.offset; 

        await search(); // Realiza la búsqueda
        backToSearchButton.classList.add('hidden'); 
    }
});
// Función para actualizar el número total de páginas
const updateTotalPages = () => {
    const totalPages = Math.ceil(totalResults / pageLimit); 
    const pageSelect = $('#page-select');
    const paginationInfo = document.getElementById('pagination-info');
    pageSelect.innerHTML = ''; 

    paginationInfo.innerHTML = `Página ${Math.ceil(offset / pageLimit) + 1} de ${totalPages}`;

    // Llenar el select con opciones de páginas
    for (let i = 1; i <= totalPages; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.text = `Página ${i}`;
        pageSelect.appendChild(option);
    }
    // Establecer el valor actual en el select
    pageSelect.value = Math.ceil(offset / pageLimit) + 1; 
};

// Evento para seleccionar una página
$('#page-select').addEventListener('change', (event) => {
    const selectedPage = parseInt(event.target.value);
    const newOffset = (selectedPage - 1) * pageLimit; 
    changePage(newOffset); 
});

const changePage = (newOffset) => {
    offset = newOffset; 
    search(); 
    updatePageSelect(Math.ceil(totalResults / pageLimit)); 
}

// Función para habilitar o deshabilitar los botones de paginación
const updatePaginationButtons = () => {
    const currentPage = Math.floor(offset / pageLimit) + 1;
    const totalPages = Math.ceil(totalResults / pageLimit);

    // Deshabilitar o habilitar los botones según la página actual
    btnFirst.disabled = currentPage === 1;
    btnPrevious.disabled = currentPage === 1;
    btnNext.disabled = currentPage === totalPages;
    btnLast.disabled = currentPage === totalPages;

    // Actualiza el select con la página actual
    const pageSelect = $('#page-select');
    pageSelect.value = currentPage;
};

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
  