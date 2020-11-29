
import { actionTypes } from '@servicenow/ui-core';
//import { createHttpEffect } from '@servicenow/ui-effect-http';
const { COMPONENT_BOOTSTRAPPED } = actionTypes;

export default {
  actionHandlers: {
    [COMPONENT_BOOTSTRAPPED]: (coeffects) => { console.log("COMPONENT_BOOTSTRAPPED: testcomponent") },
    'NOW_DROPDOWN_PANEL#SELECTED_ITEMS_SET': (coeffects) => {
      console.log('disp', coeffects);
    }
  }
}
