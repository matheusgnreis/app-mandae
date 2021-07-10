const axios = require('axios') 

exports.post = ({ appSdk }, req, res) => {
  /**
   * Treat `params` and (optionally) `application` from request body to properly mount the `response`.
   * JSON Schema reference for Calculate Shipping module objects:
   * `params`: https://apx-mods.e-com.plus/api/v1/calculate_shipping/schema.json?store_id=100
   * `response`: https://apx-mods.e-com.plus/api/v1/calculate_shipping/response_schema.json?store_id=100
   *
   * Examples in published apps:
   * https://github.com/ecomplus/app-mandabem/blob/master/functions/routes/ecom/modules/calculate-shipping.js
   * https://github.com/ecomplus/app-datafrete/blob/master/functions/routes/ecom/modules/calculate-shipping.js
   * https://github.com/ecomplus/app-jadlog/blob/master/functions/routes/ecom/modules/calculate-shipping.js
   */

  const { params, application } = req.body
  const { storeId } = req
  // setup basic required response object
  const response = {
    shipping_services: []
  }
  // merge all app options configured by merchant
  const appData = Object.assign({}, application.data, application.hidden_data)

  if (appData.free_shipping_from_value >= 0) {
    response.free_shipping_from_value = appData.free_shipping_from_value
  }
  if (!params.to) {
    // just a free shipping preview with no shipping address received
    // respond only with free shipping option
    res.send(response)
    return
  }

  const mandaeUrl = 'https://e8798d3b868356ee779846b74ae39445.m.pipedream.net'


  const resource = `/v3/postalcodes/${params.to.zip}/rates`

  const payload = {
    items: [
      {
        declaredValue: 400.00,
        weight: 0.138,
        height: 0.7,
        width: 7,
        length: 14,
        quantity: 2
      }
    ]
  } 

  // Precisamos saber algumas adicionais como o 'from'

  return axios
    .post(mandaeUrl + resource, payload)
    .then(({ data, status }) => {
      if (status === 200) {
        for (shipping of data.data.shippingServices) {
          response.shipping_services.push({
            label: shipping.name,
            carrier: shipping.name,
            service_name: 'Mandae',
            shipping_line: {
              price: shipping.price,
              total_price: shipping.price,
              discount: 0,
              delivery_time: {
                days: shipping.days,
                working_days: true
              }
            },
            flags: ['mandae-ws']
          })
          console.log(shipping)
        }

        res.send(response)
        return
      }
    })



  /* DO THE STUFF HERE TO FILL RESPONSE OBJECT WITH SHIPPING SERVICES */

  /**
   * Sample snippets:

  if (params.items) {
    let totalWeight = 0
    params.items.forEach(item => {
      // treat items to ship
      totalWeight += item.quantity * item.weight.value
    })
  }

  // add new shipping service option
  response.shipping_services.push({
    label: appData.label || 'My shipping method',
    carrier: 'My carrier',
    shipping_line: {
      from: appData.from,
      to: params.to,
      package: {
        weight: {
          value: totalWeight
        }
      },
      price: 10,
      delivery_time: {
        days: 3,
        working_days: true
      }
    }
  })

  */

  res.send(response)
}
