import {utils} from '../utils.js';
import {select, settings} from '../settings.js';
import {BaseWidget} from './BaseWidget.js';

export class DatePicker extends BaseWidget{
  constructor(wrapper){
    super(wrapper, utils.dateToStr(new Date()));
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.datePicker.input);
    thisWidget.initPlugin();
  }

  initPlugin(){
    const thisWidget = this;
    thisWidget.minDate = new Date(thisWidget.value);

    const maxDateCounter = utils.addDays(thisWidget.minDate, settings.datePicker.maxDaysInFuture);
    thisWidget.maxDate = new Date(maxDateCounter);

    const fpOptions = {
      defaultDate: thisWidget.minDate,
      minDate: thisWidget.minDate,
      maxDate: thisWidget.maxDate,
      'disable': [
        function(date) {
          // return true to disable
          return (date.getDay() === 1);
        }
      ],
      'locale': {
        'firstDayOfWeek': 1
      }  
    };
    
    // eslint-disable-next-line
    const fp = flatpickr(thisWidget.dom.input, fpOptions);
    fp.input.value = utils.dateToStr(new Date(Date.now()));

    //fp.input.value = utils.dateToStr(Date.now());
    fp.config.onChange.push(function(dateStr){
      thisWidget.value = utils.dateToStr(new Date(dateStr));
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