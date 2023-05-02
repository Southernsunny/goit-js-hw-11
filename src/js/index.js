import { PixabayAPI } from './PixabayAPI';
// import createGalleryCard from '../templates/gallery-cards.hbs';
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const refs = {
  searchForm: document.getElementById('search-form'),
  gallery: document.querySelector('.js-gallery'),
};

const pixabayApi = new PixabayAPI();

let lightbox = new SimpleLightbox('.gallery__link', {
  captions: true,
  captionsData: 'alt',
  captionDelay: 250,
});

refs.searchForm.addEventListener('submit', onRenderPage);

async function onRenderPage(e) {
  e.preventDefault();
  window.removeEventListener('scroll', handleScroll); // Відключення scroll
  // window.addEventListener('scroll', handleScroll);

  refs.gallery.innerHTML = '';

  const searchQuery = e.currentTarget.elements.searchQuery.value.trim();
  pixabayApi.query = searchQuery;

  pixabayApi.resetPage();
  // pixabayApi.page = 1;

  if (searchQuery === '') {
    alertNoEmptySearch();
    return;
  }

  try {
    const response = await pixabayApi.fetchPhotosByQuery();
    const totalPicturs = response.data.totalHits;
    const hits = response.data.hits;

    if (totalPicturs === 0) {
      alertNoEmptySearch();
      return;
    }

    // createMarkup(response.data.hits);
    createMarkup(hits);
    lightbox.refresh();
    autoScroll();

    window.addEventListener('scroll', handleScroll); // Відновлення scroll

    if (hits.length < 40) {
      // alertEndOfSearch();
      window.removeEventListener('scroll', handleScroll);
      // Notiflix.Notify.info('We found less than 40 images. No more images will be loaded.');
    }

    Notiflix.Notify.success(`Hooray! We found ${totalPicturs} images.`);
  } catch (err) {
    console.log(err);
  }
}

async function onLoadMore() {
  pixabayApi.page += 1;

  try {
    const response = await pixabayApi.fetchPhotosByQuery();

    const lastPage = Math.ceil(response.data.totalHits / pixabayApi.per_page);

    createMarkup(response.data.hits);

    lightbox.refresh();
    autoScroll();

    if (lastPage === pixabayApi.page) {
      alertEndOfSearch();
      window.removeEventListener('scroll', handleScroll);
      return;
    }
  } catch (err) {
    alertEndOfSearch();
  }
}

// function createMarkup(hits) {
//   const markup = createGalleryCard(hits);
//   refs.gallery.insertAdjacentHTML('beforeend', markup);
// }

function createGalleryCard(hits) {
  return hits
    .map(
      hit => `
      <a class='gallery__link' href='${hit.largeImageURL}'>
        <div class='gallery-item' id='${hit.id}'>
          <img
            class='gallery-item__img'
            src='${hit.webformatURL}'
            alt='${hit.tags}'
            loading='lazy'
          />
          <div class='info'>
            <p class='info-item'><b>Likes</b>${hit.likes}</p>
            <p class='info-item'><b>Views</b>${hit.views}</p>
            <p class='info-item'><b>Comments</b>${hit.comments}</p>
            <p class='info-item'><b>Downloads</b>${hit.downloads}</p>
          </div>
        </div>
      </a>
    `
    )
    .join('');
}

function createMarkup(hits) {
  const markup = createGalleryCard(hits);
  refs.gallery.insertAdjacentHTML('beforeend', markup);
}

function alertNoEmptySearch() {
  Notiflix.Notify.failure('The search string cannot be empty. Please specify your search query.');
}

function alertEndOfSearch() {
  Notiflix.Notify.warning("We're sorry, but you've reached the end of search results.");
}

// Функція для бескінечного скролу
function handleScroll() {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 5) {
    onLoadMore();
  }
}

// Цей код дозволяє автоматично прокручувати сторінку на висоту 2 карток галереї, коли вона завантажується
function autoScroll() {
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    // top: cardHeight * 2,
    top: cardHeight * 0,
    behavior: 'smooth',
  });
}







// ------- 2 variant --------

/*
const searchForm = document.getElementById('search-form');
const gallery = document.querySelector('.gallery');
let query = '';
let page = 1;
let simpleLightBox;
const perPage = 40;
searchForm.addEventListener('submit', onSearchForm);
function renderGallery(images) {
  // Перевірка чи існує галерея перед вставкою даних
  if (!gallery) {
    return;
  }
  const markup = images
    .map(image => {
      const {
        id,
        largeImageURL,
        webformatURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      } = image;
       return `
        <a class="gallery__link" href="${largeImageURL}">
          <div class="gallery-item" id="${id}">
            <img class="gallery-item__img" src="${webformatURL}" alt="${tags}" loading="lazy" />
            <div class="info">
              <p class="info-item"><b>Likes</b>${likes}</p>
              <p class="info-item"><b>Views</b>${views}</p>
              <p class="info-item"><b>Comments</b>${comments}</p>
              <p class="info-item"><b>Downloads</b>${downloads}</p>
            </div>
          </div>
        </a>
      `;
    })
    .join('');
  gallery.insertAdjacentHTML('beforeend', markup);
  // Цей код дозволяє автоматично прокручувати сторінку на висоту 2 карток галереї, коли вона завантажується
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();
  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}
function onSearchForm(e) {
  e.preventDefault();
  page = 1;
  query = e.currentTarget.elements.searchQuery.value.trim();
  gallery.innerHTML = '';
  if (query === '') {
    Notiflix.Notify.failure(
      'The search string cannot be empty. Please specify your search query.',
    );
    return;
  }
  fetchImages(query, page, perPage)
    .then(data => {
      if (data.totalHits === 0) {
        Notiflix.Notify.failure(
          'Sorry, there are no images matching your search query. Please try again.',
        );
      } else {
        renderGallery(data.hits);
        simpleLightBox = new SimpleLightbox('.gallery a').refresh();
        Notiflix.Notify.success(`Hooray! We found ${data.totalHits} images.`);
      }
    })
    .catch(error => console.log(error))
    .finally(() => {
      searchForm.reset();
    });
}
function onloadMore() {
  page += 1;
  simpleLightBox.destroy();
  fetchImages(query, page, perPage)
    .then(data => {
      renderGallery(data.hits);
      simpleLightBox = new SimpleLightbox('.gallery a').refresh();
      const totalPages = Math.ceil(data.totalHits / perPage);
      if (page > totalPages) {
        Notiflix.Notify.failure(
          "We're sorry, but you've reached the end of search results.",
        );
      }
    })
    .catch(error => console.log(error));
}
function checkIfEndOfPage() {
  return (
    window.innerHeight + window.pageYOffset >=
    document.documentElement.scrollHeight
  );
}
// Функція, яка виконуеться, якщо користувач дійшов до кінця сторінки
function showLoadMorePage() {
  if (checkIfEndOfPage()) {
    onloadMore();
  }
}
// Додати подію на прокручування сторінки, яка викликає функцію showLoadMorePage
window.addEventListener('scroll', showLoadMorePage);
*/
