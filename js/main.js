const body = document.querySelector('body');
const sideBarBox = document.querySelector('.sidebar');
const filterBtn = document.querySelector('.sidebar__filer');
const sideBarOptions = document.querySelector('.sidebar__options');
const mapPopup = document.querySelector('.popup');
const popupCallendar = document.querySelector('.popup__callendar');
const popupLocation = document.querySelector('.popup__location');
const popupSaveBtn = document.querySelector('.popup__btn-save');
const popupCloseBtn = document.querySelector('.popup__btn-cancel');
const select = document.querySelector('.popup__place');
const sideBar = document.querySelector('.sidebar__main');
const resetLocationBtn = document.querySelector('.sidebar__move');
const deleteAllMarksBtn = document.querySelector('.sidebar__delete-all');

class Mark {
	constructor(type, date, temp, location, coords, fav = false) {
		this.type = type;
		this.date = date;
		this.temp = temp;
		this.location = location;
		this.coords = coords;
		this.fav = fav;

		this._createID();
	}
	addTo() {
		const typeIcon =
			this.type === 'visited'
				? `<i class="fa-solid fa-location-dot icon icon--three"></i>`
				: `<i class="fa-solid fa-plane-departure icon icon--two"></i>`;
		let newBox = document.createElement('div');
		newBox.classList.add('mark');
		newBox.dataset.id = this.id;

		newBox.innerHTML = `<div class="mark__heading">
		<div class="mark__left">
			${typeIcon}
			<h1 class="mark__title">${this.location}</h1>
		</div>
		<div class="mark__right">
			<button class="btn btn--icon mark__fav"><i
					class="fa-solid fa-heart icon icon--notFav"></i></button>
			<button class="btn btn--icon mark__delete"><i
					class="fa-solid fa-trash icon icon--thrash"></i></button>

		</div>
	</div>
	<div class="mark__body">
		<p class="mark__date">${this.type}: ${this.date}</p>
		<p class="mark__curr-temp">currently temperature: ${this.temp}°C</p>
	</div>`;

		sideBar.append(newBox);
		setTimeout(() => {
			newBox.classList.add('mark--remove');
		}, 50);
	}

	_createID() {
		let s4 = () => {
			return Math.floor((1 + Math.random()) * 0x10000)
				.toString(16)
				.substring(1);
		};
		this.id =
			s4() +
			s4() +
			'-' +
			s4() +
			'-' +
			s4() +
			'-' +
			s4() +
			'-' +
			s4() +
			s4() +
			s4();
	}
}

class App {
	#map;
	#cords;
	#mapEvent;
	#location;
	#currLat;
	#currLng;
	#currTemp;
	#mapZoomLevel = 11;
	#marks = [];
	#layers = [];
	#temp = [];
	constructor() {
		this._getUserPosition();
		this._getDate();
		this._getLocalStorage();

		body.addEventListener('dblclick', this._openPopup.bind(this));
		popupSaveBtn.addEventListener('click', this._save.bind(this));
		popupCloseBtn.addEventListener('click', this._closePopup);
		filterBtn.addEventListener('click', this._showFilters);
		resetLocationBtn.addEventListener('click', this._resetLocation.bind(this));
		sideBarBox.addEventListener('click', this._checkMarkClik.bind(this));
		sideBarOptions.addEventListener('click', this._hanndleClicks.bind(this));
		deleteAllMarksBtn.addEventListener(
			'click',
			this._deleteAllMarks.bind(this)
		);
	}

	_getUserPosition() {
		if (navigator.geolocation)
			navigator.geolocation.getCurrentPosition(
				this._loadMap.bind(this),
				this._error
			);
		else {
			alert('Your browser dosen;t support geolocation');
		}
	}
	_error() {
		alert(
			'Spmeting went wrong. Check if your browser is allowed to use your current location and try again'
		);
	}

	_loadMap(positon) {
		const { latitude, longitude } = positon.coords;
		this.#cords = [latitude, longitude];

		this.#map = L.map('map').setView(this.#cords, this.#mapZoomLevel);
		L.tileLayer(
			`https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png?api_key=71cd2d43-0a48-4641-abbc-cc4993c56965`,
			{
				maxZoom: 20,
				attribution:
					'&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
			}
		).addTo(this.#map);

		this.#map.doubleClickZoom.disable();

		this.#map.on('dblclick', this._getClikedLocation.bind(this));

		this.#marks.forEach((mark) => {
			this._displayOnMap(mark);
		});
	}
	_resetLocation() {
		this.#map.setView(this.#cords, this.#mapZoomLevel, {
			animate: true,
			pan: {
				duration: 1,
			},
		});
	}
	_openPopup(e) {
		select.valu = 0;
		popupLocation.textContent = 'Cheking location...';
		if (e.target.classList.contains('map')) {
			mapPopup.style.display = 'flex';
			const height = mapPopup.clientHeight;
			const width = mapPopup.clientWidth;
			mapPopup.style.top = e.pageY - height / 2 + 'px';
			mapPopup.style.left = e.pageX - width / 2 + 'px';
		} else {
			this._closePopup();
		}
	}
	_closePopup() {
		mapPopup.style.display = 'none';
		select.value = 0;
	}

	_showFilters() {
		sideBarOptions.classList.toggle('sidebar__options--open');
	}
	_getDate() {
		const day = new Date();

		const currDay = day.getDate();
		const currMonth = day.getMonth() + 1;
		const currYear = day.getFullYear();
		let callendarFormat;
		if (currDay < 10 && currMonth < 10) {
			callendarFormat = `${currYear}-0${currMonth}-0${currDay}`;
		} else if (currDay < 10) {
			callendarFormat = `${currYear}-${currMonth}-0${currDay}`;
		} else if (currMonth < 10) {
			callendarFormat = `${currYear}-0${currMonth}-${currDay}`;
		} else {
			callendarFormat = `${currYear}-${currMonth}-${currDay}`;
		}
		popupCallendar.value = callendarFormat;
	}
	_checkWeather(x, y, id = 0) {
		const options = {
			method: 'GET',
			headers: {
				'X-RapidAPI-Key': 'da6a36788dmsh3042e986f68ebc2p1577b7jsnc1a2cc8b2715',
				'X-RapidAPI-Host': 'weatherapi-com.p.rapidapi.com',
			},
		};

		fetch(
			`https://weatherapi-com.p.rapidapi.com/forecast.json?q=${x}%20${y}`,
			options
		)
			.then((response) => response.json())
			.then((response) => {
				this.#currTemp = response.current?.temp_c;

				//  update off temp for existing marks
				if (id != 0) {
					this.#marks.forEach((mark) => {
						if (mark.id === id) {
							const el = document
								.querySelector(`[data-id="${mark.id}"]`)
								.querySelector('.mark__curr-temp');
							mark.temp = this.#currTemp;
							el.textContent = `currently temperature: ${mark.temp}°C`;
						}
					});
				}
			})
			.catch((err) => console.error(err));
	}
	_checkLocation(lat, lng) {
		const link = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}`;

		fetch(link)
			.then((res) => {
				if (!res.ok) throw new Error('Unknow location');
				return res.json();
			})
			.then((data) => (this.#location = data.city))
			.then(
				() => (popupLocation.textContent = this.#location ?? 'Unknow location')
			)
			.catch((err) => console.log(err.message));
	}
	_getClikedLocation(mapE) {
		this.#mapEvent = mapE;
		const { lat, lng } = this.#mapEvent.latlng;
		this.#currLat = lat;
		this.#currLng = lng;
		this._checkWeather(lat, lng);
		this._checkLocation(lat, lng);
	}
	_save() {
		if (Number(select.value) === 0) {
			alert('Choose option');
		} else {
			const selected = select.options[select.selectedIndex].text;
			const userDate = popupCallendar.value;
			mapPopup.style.display = 'none';
			this._renderMark([this.#currLat, this.#currLng], selected, userDate);
			this._closePopup();
		}
	}
	_renderMark(coords, userSelect, userDate) {
		if (typeof this.#location == 'undefined') {
			alert('Could not add this location');
		} else {
			this._displayMark(coords, userSelect);
			this._showMark(userSelect, userDate);
		}
	}
	_displayMark(coords, userSelect, savedLocation = null) {
		const typeIcon =
			userSelect === 'visited'
				? `<i class="fa-solid fa-location-dot icon icon--three icon--margin"></i>`
				: `<i class="fa-solid fa-plane-departure icon icon--two icon--margin"></i>`;

		const marker = L.marker(coords, {
			iconUrl: 'leaf-green.png',
			shadowUrl: 'leaf-shadow.png',
		})
			.addTo(this.#map)
			.bindPopup(
				L.popup({
					minWidth: 100,
					autoClose: false,
					closeOnClick: false,
					className: `${userSelect}-popup`,
				})
			)
			.setPopupContent(`${typeIcon} ${this.#location?.name ?? savedLocation}`)
			.openPopup();

		this.#layers.push(marker);
	}
	_showMark(type, date) {
		const clikedCoords = [this.#currLat, this.#currLng];
		const newMark = new Mark(
			type,
			date,
			this.#currTemp,
			this.#location.name,
			clikedCoords
		);
		newMark.addTo();
		this.#marks.push(newMark);
		this._setLocalStorage();
	}
	_checkMarkClik(e) {
		if (e.target.classList.contains('mark__delete')) {
			this._deleteMark(e.target);
		}
		if (e.target.classList.contains('mark__fav')) {
			this._manageFav(e.target);
		}
		if (
			e.target.classList.contains('mark') ||
			e.target.classList.contains('mark__heading')
		) {
			this._moveTo(e.target);
		}
	}

	_manageFav(curr) {
		const currIcon = curr.children[0];
		const parent = curr.closest('.mark');
		const parentID = parent.dataset.id;

		this.#marks.forEach((mark) => {
			if (parentID === mark.id) {
				if (mark.fav) {
					mark.fav = false;
					currIcon.classList.add('icon--notFav');
					currIcon.classList.remove('icon--fav');
				} else {
					mark.fav = true;
					currIcon.classList.add('icon--fav');
					currIcon.classList.remove('icon--notFav');
				}
			}
		});

		this._setLocalStorage();
	}
	_deleteMark(curr) {
		const parent = curr.closest('.mark');
		const parentID = parent.dataset.id;
		this.#marks.forEach((mark, i) => {
			if (parentID === mark.id) {
				this._movement(mark.coords);
				this.#marks.splice(i, 1);
				parent.remove();

				setTimeout(() => {
					this.#map.removeLayer(this.#layers[i]);
					this.#layers.splice(i, 1);
				}, 1000);
			}
		});
		this._setLocalStorage();
	}
	_movement(coords) {
		this.#map.setView(coords, this.#mapZoomLevel, {
			animate: true,
			pan: {
				duration: 1,
			},
		});
	}
	_moveTo(curr) {
		const parent = curr.closest('.mark');
		const parentID = parent.dataset.id;
		this.#marks.forEach((mark) => {
			if (parentID === mark.id) {
				this._movement(mark.coords);
			}
		});
	}
	_setLocalStorage() {
		localStorage.setItem('marks', JSON.stringify(this.#marks));
	}
	_getLocalStorage() {
		const data = JSON.parse(localStorage.getItem('marks'));
		if (!data) return;
		this.#marks = data;
		this.#marks.forEach((mark, i) => {
			this._displayOnSideBar(mark);
		});
		this._addToMarks();
		this._restoreFav();
	}
	_deleteAllMarks() {
		if (this.#marks.length > 0) {
			if (confirm('Are you sure? Your data will be lost')) {
				localStorage.removeItem('marks');
				location.reload();
			}
		} else {
			alert('Nothing to delete');
		}
	}
	_displayOnSideBar(mark) {
		const newMark = new Mark(
			mark.type,
			mark.date,
			mark.temp,
			mark.location,
			mark.coords,
			mark.fav
		);
		newMark.addTo();
		this.#temp.push(newMark);
	}
	_restoreFav() {
		const marks = this.#marks;

		const els = document.querySelectorAll('.mark');

		els.forEach((el, i) => {
			if (marks[i].id === el.dataset.id) {
				const isFav = marks[i].fav;
				const btn = el.children[0].children[1].children[0].children[0];
				if (isFav) {
					btn.classList.add('icon--fav');
					btn.classList.remove('icon--notFav');
				} else {
					btn.classList.add('icon--notFav');
					btn.classList.remove('icon--fav');
				}
			}
		});
	}
	_addToMarks() {
		this.#marks.forEach((_, i) => {
			this.#marks[i] = this.#temp[i];
		});
	}
	_displayOnMap(mark) {
		this._checkWeather(...mark.coords, mark.id);
		this._displayMark(mark.coords, mark.type, mark.location);
		this._resetLocation();
	}
	_hanndleClicks(e) {
		const target = e.target;

		if (e.target.classList.contains('sidebar__all-btn')) {
			this._showAll();
		}
		if (e.target.classList.contains('sidebar__planned-btn')) {
			this._manageFilter('visited');
		}
		if (e.target.classList.contains('sidebar__visited-btn')) {
			this._manageFilter('planned');
		}
		if (e.target.classList.contains('sidebar__fav-btn')) {
			this._filterFav();
		}
	}
	_showAll() {
		const all = document.querySelectorAll('.mark');
		all.forEach((el) => {
			el.style.display = 'block';
		});
	}
	_manageFilter(t) {
		this._showAll();
		const all = document.querySelectorAll('.mark');
		this.#marks.forEach((mark, i) => {
			if (mark.type === t) {
				if (mark.id === all[i].dataset.id) {
					all[i].style.display = 'none';
				}
			}
		});
	}
	_filterFav() {
		this._showAll();

		const all = document.querySelectorAll('.mark');
		this.#marks.forEach((mark, i) => {
			if (!mark.fav) {
				all[i].style.display = 'none';
			}
		});
	}
}

const app = new App();
