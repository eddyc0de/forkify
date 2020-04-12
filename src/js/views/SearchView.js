import { elements } from './base';

export const getInput = () => elements.searchInput.value;

export const clearInput = () => elements.searchInput.value = '';

export const clearResults = () => {
	elements.searchResList.innerHTML = '';
	elements.searchResPages.innerHTML = '';
};

export const highlightSelected = id => {
	//Selecting all the list item from the search with Array.from which creates an array form a nodeList
	const resultsArr = Array.from(document.querySelectorAll('.results__link'));

	resultsArr.forEach(el => {
		el.classList.remove('results__link--active');
	});

	document.querySelector(`.results__link[href="#${id}"]`).classList.add('results__link--active');
};

export const limitRecipeTitle = (title, limit = 17) => {
	const newTitle = [];
	if(title.length > limit) {
		title.split(' ').reduce((acc, cur) => {
			if(acc + cur.length <= limit) {
				newTitle.push(cur);
			}
			return acc + cur.length; //Returns the total length to the accumulator
		}, 0);
		//Returns the result
		return `${newTitle.join(' ')}...`;
	}
	return title; //if the title length is shorter than the limit just returns the title
};

const renderRecipe = recipe => {
	const markup = `
			<li>
			<a class="results__link" href="#${recipe.recipe_id}">
				<figure class="results__fig">
					<img src="${recipe.image_url}" alt="${recipe.title}">
				</figure>
				<div class="results__data">
					<h4 class="results__name">${limitRecipeTitle(recipe.title)}</h4>
					<p class="results__author">${recipe.publisher}</p>
				</div>
			</a>
		</li>
	`;
	elements.searchResList.insertAdjacentHTML('beforeend', markup);
};

//type: can be 'prev' or 'next'
const createButton = (page, type) => `
	<button class="btn-inline results__btn--${type}" data-goto="${type === 'prev' ? page - 1 : page + 1}">
		<span>Page ${type === 'prev' ? page - 1 : page + 1}</span>	
		<svg class="search__icon">
			<use href="img/icons.svg#icon-triangle-${type === 'prev' ? 'left' : 'right'}"></use>
		</svg>
	</button>
`;

const renderButtons = (page, numResults, resPerPage) => {
	/* Rounds up the number 
	For Example: As a page cannot be 4.5 if we get 45 results and displaying 10 per page */
	const pages = Math.ceil(numResults / resPerPage);

	let button;
	if (page === 1 && pages > 1) {
		//Button to go to the next page
		button = createButton(page, 'next');
	} else if (page < pages) {
		//Both buttons
		button = `${createButton(page, 'prev')} ${createButton(page, 'next')}`;
	} else if (page === pages && pages > 1) {
		//Button to go to the previous page
		button = createButton(page, 'prev');
	}
	elements.searchResPages.insertAdjacentHTML('afterbegin', button);
};

export const renderResults = (recipes, page = 1, resPerPage = 10) => {
	//Pagination: renders result of current page
	const start = (page - 1) * resPerPage;
	const end = page * resPerPage;

	//Slices the results in 10 elements and calls renderRecipe method with the current recipe
	recipes.slice(start, end).forEach(renderRecipe);

	//Render pagination buttons
	renderButtons(page, recipes.length, resPerPage);
};