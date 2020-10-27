import {select, templates, settings, classNames} from '../settings.js';
import {utils} from '../utils.js';
import {AmountWidget} from './AmountWidget.js';
import {DatePicker} from './DatePicker.js';
import {HourPicker} from './HourPicker.js';

export class Booking{
  constructor(widgetContainer){
    this.render(widgetContainer);
    this.initWidgets();
    this.getData();
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

  updateDOM(){
    const thisBooking = this;
    console.log(thisBooking.booked);
    
    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);     

    for(const table of thisBooking.dom.tables){
      // get every table ID
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      // make it a number
      if(!isNaN(tableId)){ tableId = parseInt(tableId); }  

      if(typeof thisBooking.booked[thisBooking.date] != 'undefined'){ // does date exist?
        let hours = thisBooking.booked[thisBooking.date]; // all hours in chosen date
        
        for(let hour in hours){
          if(hour == thisBooking.hour){ // select correct hour
            let bookedTables = hours[hour]; // table numbers inside
            if(bookedTables.includes(tableId)){ // does tableId exist in bookedTables?
              for(let bookedTableId in bookedTables){
                let bookedTable = bookedTables[bookedTableId]; // tablenumber inside hour
                if(tableId == bookedTable){
                  table.classList.add(classNames.booking.tableBooked);
                }
              }
            }else{
              table.classList.remove(classNames.booking.tableBooked);
            }
          }
        }
      }
    }
  }

}