import {select, templates} from '../settings.js';
import {utils} from '../utils.js';
import { AmountWidget } from './AmountWidget.js';

export class Booking{
  constructor(widgetContainer){
    this.render(widgetContainer);
    this.initWidgets();
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
  }

  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
  }
}