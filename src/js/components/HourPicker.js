import {select, settings} from '../settings.js';
import {utils} from '../utils.js';
import {BaseWidget} from './BaseWidget.js';

export class HourPicker extends BaseWidget{
  constructor(wrapper){
    super(wrapper, utils.numberToHour(settings.hours.open));
    const thisWidget = this;
    
    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.hourPicker.input);
    thisWidget.dom.output = thisWidget.dom.wrapper.querySelector(select.widgets.hourPicker.output);
    
    thisWidget.initPlugin();
    thisWidget.dom.output.innerHTML = thisWidget.correctValue;
  }

  initPlugin(){
    const thisWidget = this;
    // eslint-disable-next-line
    rangeSlider.create(thisWidget.dom.input);

    thisWidget.dom.input.addEventListener('input', function(){
      thisWidget.value = thisWidget.dom.input.value;
    });
  }

  parseValue(newValue){
    const parsedValue = utils.numberToHour(newValue);
    return parsedValue;
  }

  isValid(){
    return true;
  }

  renderValue(){
    const thisWidget = this;
    thisWidget.dom.output.innerHTML = thisWidget.value;    
  }
}