import express from 'express';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dialogflow from 'dialogflow'
import { WebhookClient } from 'dialogflow-fulfillment'

const app = express()
app.use(express.json())
app.use(cors())
app.use(morgan('dev'))

app.get('/', (req, res) => {
    res.sendStatus(200);
});

const pluck = (arr) => {
    const min = 0;
    const max = arr.length - 1;
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    return arr[randomNumber]
}

app.get("/ping", (req, res) => {
    res.send("ping back");
})

const port = process.env.PORT || 5001;


/*---------------------APIs--------------------------*/

app.post('/webhook', async (req, res) => {

    try {
        const body = req.body;

        const intentName = body.queryResult.intent.displayName
        const params = body.queryResult.parameters

        //console.log(intentName, params)

        switch (intentName) {
            case "Welcome":
                {
                    res.send({
                        "fulfillmentMessages": [
                            {
                                "text": {
                                    "text": [
                                        "Welcome to the Cake Shop! How can I help you?"
                                    ]
                                },
                                'payload': {
                                    "richContent": [
                                        [
                                            {
                                                "type": "button",
                                                "icon": {
                                                    "type": "chevron_right",
                                                    "color": "#FF9800"
                                                },
                                                "text": "Button text",
                                                "link": "https://example.com",
                                                "event": {
                                                    "name": "",
                                                    "languageCode": "",
                                                    "parameters": {}
                                                }
                                            }
                                        ]
                                    ]
                                }
                            }
                        ]
                    })
                    break;
                }
            case "OrderCake":
                {
                    let flavor = params.CakeFlavor
                    let size = params.CakeSize
                    let quantity = params.CakeQuantity

                    console.log('flavor: ', flavor)
                    console.log('size: ', size)
                    console.log('quantity: ', quantity)

                    if (!size) {
                        res.send({
                            "fulfillmentMessages": [
                                {
                                    "text": {
                                        "text": [
                                            "What size would you like your cake to be? Please specify in pounds (e.g. 1 pound, 2.5 pounds)."
                                        ]
                                    }
                                }
                            ]
                        })
                    }
                    else if (!flavor) {
                        res.send({
                            "fulfillmentMessages": [
                                {
                                    "text": {
                                        "text": [
                                            "What flavor would you like your cake to be?"
                                        ]
                                    }
                                }
                            ]
                        })
                    }
                    else if (quantity == undefined) {
                        quantity = 1
                    }

                    const newOrder = new orderModel({
                        orderNumber: Math.floor(Math.random() * 1000000000),
                        orderName: "Cake",
                        cakeSize: size.amount,
                        CakeFlavor: flavor,
                        qty: quantity == undefined ? 1 : quantity // if quantity is undefined, set it to 1
                    })

                    newOrder.save((err, doc) => {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            console.log(doc);
                        }
                    })

                    res.send({
                        "fulfillmentMessages": [
                            {
                                "text": {
                                    "text": [
                                        `You ordered ${quantity} ${flavor} cake of size ${size.amount} pound. Your order number is ${newOrder.orderNumber}. Feel free to ask me about your order status.`
                                    ]
                                }
                            }
                        ]
                    })

                    break;
                }
            // case "CheckOrderStatus":
            //     {
            //         let orderNumber = params.orderNumber

            //         if (!orderNumber) {
            //             res.send({
            //                 "fulfillmentMessages": [
            //                     {
            //                         "text": {
            //                             "text": [
            //                                 "Please provide your order number."
            //                             ]
            //                         }
            //                     }
            //                 ]
            //             });
            //             return;
            //         }

            //         orderModel.findOne({ orderNumber: orderNumber }, function (err, order) {
            //             if (err) {
            //                 console.log(err);
            //                 res.send({
            //                     "fulfillmentMessages": [
            //                         {
            //                             "text": {
            //                                 "text": [
            //                                     "something is wrong in server, please try again"
            //                                 ]
            //                             }
            //                         }
            //                     ]
            //                 })
            //             }
            //             else {
            //                 if (order) {
            //                     res.send({
            //                         "fulfillmentMessages": [
            //                             {
            //                                 "text": {
            //                                     "text": [
            //                                         `Your order status is ${order.status}.`
            //                                     ]
            //                                 }
            //                             }
            //                         ]
            //                     })
            //                 }
            //                 else {
            //                     res.send({
            //                         "fulfillmentMessages": [
            //                             {
            //                                 "text": {
            //                                     "text": [
            //                                         "No order found with this order number."
            //                                     ]
            //                                 }
            //                             }
            //                         ]
            //                     })
            //                 }
            //             }
            //         }
            //         )

            //     }
            default: {
                res.send({
                    "fulfillmentMessages": [
                        {
                            "text": {
                                "text": [
                                    "something is wrong in server, please try again"
                                ]
                            }
                        }
                    ]
                })
            }
        }

    }
    catch (err) {
        console.log(err);
        res.send({
            "fulfillmentMessages": [
                {
                    "text": {
                        "text": [
                            "something is wrong in server, please try again"
                        ]
                    }
                }
            ]
        })
    }

});


/*---------------------Static Files--------------------------*/

const __dirname = path.resolve();
app.get('/', express.static(path.join(__dirname, "/Web/index.html")));
app.use('/', express.static(path.join(__dirname, "/Web")));

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})


/*------------------Schema------------------*/
let orderSchema = new mongoose.Schema({
    orderNumber: { type: Number, required: true, unique: true },
    orderName: { type: String, required: true },
    cakeSize: { type: Number, required: true },
    CakeFlavor: { type: String, required: true },
    qty: { type: Number, required: true },
    status: { type: String, default: "pending" }, // canceled, inProgress delivered
    createdOn: { type: Date, default: Date.now }
});

const orderModel = mongoose.model('cakeOrders', orderSchema);


/*---------------------Database--------------------------*/
let dbURI = 'mongodb+srv://NabeelSohail:Nabeel30@cluster0.lidnkc6.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(dbURI);

mongoose.connection.on('connected', () => {
    console.log('Mongoose is connected');
}
);

mongoose.connection.on('error', (err) => {
    console.log('Mongoose connection error: ', err);
}
);

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose is disconnected');
}

);

process.on('SIGINT', () => {
    mongoose.connection.close(() => {
        console.log('Mongoose is disconnected due to application termination');
        process.exit(0);
    });
}
);