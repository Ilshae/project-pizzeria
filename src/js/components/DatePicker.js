import {utils} from '../utils.js';
import {select, settings} from '../settings.js';
import {BaseWidget} from './BaseWidget.js';

export class DatePicker extends BaseWidget{
  constructor(wrapper){
    super(wrapper, utils.dateToStr(new Date()));
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.datePicker.input);

    thisWidget.dom.input.value = utils.dateToStr(new Date);
    
    thisWidget.initPlugin();
  }

  initPlugin(){
    const thisWidget = this;

    thisWidget.minDate = new Date(thisWidget.value);
    const maxDateCounter = utils.addDays(thisWidget.minDate, settings.datePicker.maxDaysInFuture);
    thisWidget.maxDate = new Date(maxDateCounter);
  
    // eslint-disable-next-line
    flatpickr(thisWidget.dom.input, {
      defaultDate: thisWidget.minDate,
      minDate: thisWidget.minDate,
      maxDate: thisWidget.maxDate,
      locale: {
        firstDayOfWeek: 1,
      },
      disable: [
        function (date) {       
          return date.getDay() === 1;
        },
      ],
      onChange: function (selectedDates, dateStr) {
        thisWidget.value = dateStr;
      },
    });
  }

  parseValue(Value){
    return Value;
  }

  isValid(){
    return true;
  }

  renderValue(){
    console.log('renderValue()');
  }
}