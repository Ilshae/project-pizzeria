import {select, templates, settings, classNames} from '../settings.js';
import {utils} from '../utils.js';
import {AmountWidget} from './AmountWidget.js';
import {DatePicker} from './DatePicker.js';
import {HourPicker} from './HourPicker.js';

export class Booking{
  constructor(widgetContainer){
    const thisBooking = this;

    thisBooking.render(widgetContainer);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.selectTable();
  }

  render(widgetContainer){
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = widgetContainer;

    const element = utils.createDOMFromHTML(generatedHTML);
   
    thisBooking.dom.wrapper.appendChild(element);

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.datePicker = document.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = document.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.inputAddress = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.inputPhone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector('.booking-form');
  }

  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });

    thisBooking.dom.form.addEventListener('submit', function () {
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }

  getData(){
    const thisBooking = this;
    const startEndDates = {};
    startEndDates[settings.db.dateStartParamKey] = utils.dateToStr(thisBooking.datePicker.minDate);
    startEndDates[settings.db.dateEndParamKey] = utils.dateToStr(thisBooking.datePicker.maxDate);
  
    const endDate = {};
    endDate[settings.db.dateEndParamKey] = startEndDates[settings.db.dateEndParamKey];
  
    const params = {
      booking: utils.queryParams(startEndDates),
      eventsCurrent: settings.db.notRepeatParam + '&' + utils.queryParams(startEndDates),
      eventsRepeat: settings.db.repeatParam + '&' + utils.queryParams(endDate),
    };

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking,
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent,
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat,
    };
    
    //console.log('getData urls', urls);
    //console.log('getData params', params);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function([bookingsResponse, eventsCurrentResponse, eventsRepeatResponse]){
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;
    thisBooking.booked = {};

    for(let booking of bookings){
      thisBooking.makeBooked(booking.date, booking.hour, booking.duration, booking.table);
    }
    for(let eventCurrent of eventsCurrent){
      thisBooking.makeBooked(eventCurrent.date, eventCurrent.hour, eventCurrent.duration, eventCurrent.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let eventRepeat of eventsRepeat){
      if(eventRepeat.repeat == 'daily'){
        for(let repeatDate = minDate; repeatDate <= maxDate; repeatDate = utils.addDays(repeatDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(repeatDate), eventRepeat.hour, eventRepeat.duration, eventRepeat.table);
        }
      }
    }
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;
    
    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){  
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;
    // console.log('booked', thisBooking.booked);
    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] ==
        'undefined'
    ){
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables) {
      const tableId = parseInt(table.getAttribute(settings.booking.tableIdAttribute));

      if(
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
        table.classList.remove(classNames.booking.tableSelected);
      }else{
        table.classList.remove(classNames.booking.tableBooked, classNames.booking.tableSelected);
      }  
    }
    
  }

  selectTable() {
    const thisBooking = this;

    for (let table of thisBooking.dom.tables) { 
      table.addEventListener('click', function () {
        if (!table.classList.contains(classNames.booking.tableBooked)){
          table.classList.toggle(classNames.booking.tableSelected);
          thisBooking.blockOverbooking(table);
        }else {
          table.classList.remove(classNames.booking.tableSelected);
        }
      });
    }
  }

  blockOverbooking(table) {
    const thisBooking = this;

    const maxDuration = 24 - utils.hourToNumber(thisBooking.hourPicker.value);     
    //const bookingButton = document.querySelector(select.booking.bookTable);
    const thisHour = utils.hourToNumber(thisBooking.hourPicker.value);
    thisBooking.disabled = false;

    if (thisBooking.hoursAmount.value > maxDuration) {
      thisBooking.disabled = true;
      alert('Your booking duration is too long - the opening hours are 12pm-12am. Please set other duration.');
    }
  
    const tableId =  parseInt(table.getAttribute(settings.booking.tableIdAttribute));

    for (let hourBlock = thisHour; hourBlock < thisHour + thisBooking.hoursAmount.value; hourBlock += 0.5) {

      if (thisBooking.booked[thisBooking.date][hourBlock].includes(tableId)) {
        thisBooking.disabled = true;
        alert('This table is already booked within this time. Please set other duration.');
      }
    }
  }

  sendBooking() {
    const thisBooking = this;
    
    if(!thisBooking.disabled){
      const url = settings.db.url + '/' + settings.db.booking;

      const payload = {
        date: thisBooking.date,
        hour: thisBooking.hourPicker.value,
        table: [],
        ppl: thisBooking.peopleAmount.value,
        duration: thisBooking.hoursAmount.value,
        starters: [],
        address: thisBooking.dom.inputAddress.value,
        phone: thisBooking.dom.inputPhone.value,
      };
      
      for (let starter of thisBooking.dom.starters) {
        if (starter.checked == true) {
          payload.starters.push(starter.value);
        }
      }

      for (let table of thisBooking.dom.tables) {
        const tableId = parseInt(table.getAttribute(settings.booking.tableIdAttribute));
        if (table.classList.contains('selected')) {
          payload.table.push(tableId);
          payload.table = parseInt(payload.table);
          table.classList.replace('selected', 'booked');
        }
      }

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };

      fetch(url, options)
        .then(function (response) {
          return response.json();
        })
        .then(function (parsedResponse) {
          console.log('parsedResponse', parsedResponse);
          thisBooking.getData();
        });
        
    }else{
      alert('This table is already booked or booking duration is too long.');
    }
  }
  
}
