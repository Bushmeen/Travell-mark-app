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
class Mark {
	constructor(type, date, temp, location, coords) {
		this.type = type;
		this.date = date;
		this.temp = temp;
		this.location = location;
		this.coords = coords;
		this.fav = false;

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
	constructor() {
		this._getUserPosition();
		this._getDate();

		body.addEventListener('dblclick', this._openPopup.bind(this));
		popupSaveBtn.addEventListener('click', this._save.bind(this));
		popupCloseBtn.addEventListener('click', this._closePopup);
		filterBtn.addEventListener('click', this._showFilters);
		resetLocationBtn.addEventListener('click', this._resetLocation.bind(this));
		sideBarBox.addEventListener('click', this._checkMarkClik.bind(this));
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
	_checkWeather(x, y) {
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
				this.#location = response.location;
			})
			.then(
				() =>
					(popupLocation.textContent =
						this.#location?.name ?? 'Unknow location')
			)
			.catch((err) => console.error(err));
	}
	_getClikedLocation(mapE) {
		this.#mapEvent = mapE;
		const { lat, lng } = this.#mapEvent.latlng;
		this.#currLat = lat;
		this.#currLng = lng;
		this._checkWeather(lat, lng);
	}
	_save() {
		if (Number(select.value) === 0) {
			alert('Choose option');
		} else {
			const selected = select.options[select.selectedIndex].text;
			const userDate = popupCallendar.value;
			mapPopup.style.display = 'none';
			this._renderMark(
				[this.#currLat, this.#currLng],
				selected,
				userDate,
				selected
			);
			this._closePopup();
		}
	}
	_renderMark(coords, userSelect, userDate, selected) {
		if (typeof this.#location == 'undefined') {
			alert('Could not add this location');
		} else {
			const typeIcon =
				selected === 'visited'
					? `<i class="fa-solid fa-location-dot icon icon--three icon--margin"></i>`
					: `<i class="fa-solid fa-plane-departure icon icon--two icon--margin"></i>`;

			L.marker(coords, {
				iconUrl: 'leaf-green.png',
				shadowUrl: 'leaf-shadow.png',
			})
				.addTo(this.#map)
				.bindPopup(
					L.popup({
						maxWidth: 250,
						minWidth: 100,
						autoClose: false,
						closeOnClick: false,
						className: `${selected}-popup`,
					})
				)
				.setPopupContent(`${typeIcon} ${this.#location?.name}`)
				.openPopup();
			this._showMark(userSelect, userDate);
		}
	}
	_showMark(type, date) {
		const newMark = new Mark(
			type,
			date,
			this.#currTemp,
			this.#location.name,
			this.#cords
		);
		newMark.addTo();
		this.#marks.push(newMark);
	}
	_checkMarkClik(e) {
		if (e.target.classList.contains('mark__delete')) {
			this._deleteMark(e.target);
		}
	}
	_deleteMark(curr) {
		const parent = curr.closest('.mark');
		const parentID = parent.dataset.id;
		this.#marks.forEach((mark, i) => {
			if (parentID === mark.id) {
				this.#marks.splice(i, 1);
				parent.remove();
			}
		});
	}
}

const app = new App();
