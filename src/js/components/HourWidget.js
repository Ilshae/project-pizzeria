import {settings} from '../settings.js';
import {AmountWidget} from './AmountWidget.js';

export class HourWidget extends AmountWidget{

  isValid(newValue){
    return !isNaN(newValue) && newValue >= settings.hourWidget.defaultMin && newValue <= settings.amountWidget.defaultMax;
  }

  initActions(){
    const thisWidget = this;

    thisWidget.dom.input.addEventListener('change', function(){
      thisWidget.value = thisWidget.dom.input.value;
    });
    
    thisWidget.dom.linkDecrease.addEventListener('click', function(event){
      event.preventDefault();
      thisWidget.value = thisWidget.dom.input.value-parseFloat(0.5);
    });

    thisWidget.dom.linkIncrease.addEventListener('click', function(event){
      event.preventDefault();
      thisWidget.value = parseFloat(thisWidget.dom.input.value)+parseFloat(0.5);
    });
  }
}