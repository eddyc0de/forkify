import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/SearchView';
import * as recipeView from './views/RecipeView';
import * as listView from './views/ListView';
import * as likesView from './views/LikesView';
import { elements, renderLoader, clearLoader } from './views/base';

/** OBJECT TO MANAGE GLOBAL STATE OF THE APP
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 **/
const state = {};


/**
 * SEARCH CONTROLLER
 */
const controlSearch = async () => {
	// 1. Get the query string from the view
	const query = searchView.getInput();

	if(query) {
		// 2. New search object and add to state
		state.search = new Search(query);

		// 3. Prepare UI for results
		searchView.clearInput();
		searchView.clearResults();
		renderLoader(elements.searchRes);

		try {
			// 4. Search for recipes
			await state.search.getResults();

			// 5. Render results on UI
			clearLoader();
			searchView.renderResults(state.search.result);
		}catch(error) {
			alert('Something went wrong with the Search');
			clearLoader();
		}
	}
};

/**
 * SEARCH CONTROLLER: EVENT HANDLERS
 */
elements.searchForm.addEventListener('submit', e => {
	e.preventDefault(); //Prevents page reloading
	controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
	const btn = e.target.closest('.btn-inline'); //Gets the closest parent element of the clicked element
	
	if (btn) {
		const goToPage = parseInt(btn.dataset.goto, 10); //Gets the data-goto html attribute
		searchView.clearResults();
		searchView.renderResults(state.search.result, goToPage);
	}
});


/**
 * RECIPE CONTROLLER
 */
 const controlRecipe = async () => {
	 //Get the ID from the url
	const id = window.location.hash.replace('#', '');

	if (id) {
		//Prepare de UI for changes
		recipeView.clearRecipe();
		renderLoader(elements.recipe);

		//Highlight selected search item(recipe)
		if (state.search) searchView.highlightSelected(id);

		//Create new recipe object
		state.recipe = new Recipe(id);

		try {
			//Get recipe data and parse ingredients
			await state.recipe.getRecipe();
			state.recipe.parseIngredients();

			//Calculate servings and time
			state.recipe.calcTime();
			state.recipe.calcServings();

			//Render recipe
			clearLoader();
			recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
			console.log(state.recipe);
		} catch(error) {
			alert('Error processing recipe');
			console.log(error);
		}
	}
 };

 /**
  * RECIPE CONTROLLER: EVENT HANDLERS
  */
 // Add more than one event to an event listener
 ['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

 // Handling recipe button clicks/actions
 elements.recipe.addEventListener('click', e => {
	 // * after the selector means any child element.
	if(e.target.matches('.btn-decrease, .btn-decrease *'))  {
		//Decrease button is clicked
		if(state.recipe.servings > 1) {
			state.recipe.updateServings('dec');
			recipeView.updateServingsIngredients(state.recipe);
		}
	} else if(e.target.matches('.btn-increase, .btn-increase *'))  {
		//Increase button is clicked
		state.recipe.updateServings('inc');
		recipeView.updateServingsIngredients(state.recipe);
	} else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
		//We call the controller from here as when the DOM loads for the first time these elements are not rendered yet.
		//Add ingredients to shopping list
		controlList();
	} else if(e.target.matches('.recipe__love, .recipe__love *')) {
		//Like controller
		controlLike();
	}
 });


 /**
  * LIST CONTROLLER
  */
const controlList = () => {
	// Create a new list if there is not one yet
	if(!state.list) state.list = new List();

	// Add each ingredient to the list and UI
	state.recipe.ingredients.forEach(el => {
		const item = state.list.addItem(el.count, el.unit, el.ingredient);
		listView.renderItem(item);
	});
};

/**
* LIST CONTROLLER: EVENT HANDLERS
*/
elements.shopping.addEventListener('click', e => {
	//Targest the closest parent element and gets the html attribute itemid which contains the id of that item
	const id = e.target.closest('.shopping__item').dataset.itemid;

	//Handle the delete button
	if(e.target.matches('.shopping__delete, .shopping__delete *')) {
		//Delete from state
		state.list.deleteItem(id);

		//Delete from UI
		listView.deleteItem(id);
	//Handle the count update
	} else if(e.target.matches('.shopping__count--value')) {
		const val = parseFloat(e.target.value, 10);
		state.list.updateCount(id, val);
	}
});


/**
* LIKE CONTROLLER
*/
const controlLike = () => {
	if(!state.likes) state.likes = new Likes();
	const currentID = state.recipe.id;

	//User has not yet liked current recipe
	if(!state.likes.isLiked(currentID)) {
		//Add like to the state
		const newLike = state.likes.addLike(currentID, 
			state.recipe.title, 
			state.recipe.author, 
			state.recipe.img);

		//Toggle the like button
		likesView.toggleLikeBtn(true);

		//Add like to the UI list
		likesView.renderLike(newLike);

	//User has yet liked current recipe
	} else {
		//Remove like to the state
		state.likes.deleteLike(currentID);

		//Toggle the like button
		likesView.toggleLikeBtn(false);

		//Remove like from the UI list
		likesView.deleteLike(currentID);
	}
	likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//Restore like recipes on page load
window.addEventListener('load', () => {
	state.likes = new Likes(); 

	//Restore likes
	state.likes.readStorage();

	//Toggle like button menu
	likesView.toggleLikeMenu(state.likes.getNumLikes());

	//Render the existing likes
	state.likes.likes.forEach(like => {
		likesView.renderLike(like);
	});
});
