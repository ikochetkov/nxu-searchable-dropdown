
import { actionTypes } from '@servicenow/ui-core';
const { COMPONENT_BOOTSTRAPPED} = actionTypes;

export default {
  actionHandlers: {
    [COMPONENT_BOOTSTRAPPED]: (coeffects) => { console.log("COMPONENT_BOOTSTRAPPED: 43434-test-component") },
  }
}
