// Good event
dataLayer.push({
    event: "purchase",
    ecommerce: {
        transaction_id: "T_12345",
        value: 25.42,
        tax: 4.90,
        shipping: 5.99,
        currency: "USD",
        coupon: "SUMMER_SALE",
        items: [
         {
          item_id: "SKU_12345",
          item_name: "Google Grey Men's Tee",
          affiliation: "Google Merchandise Store",
          coupon: "SUMMER_FUN",
          discount: 2.22,
          index: 0,
          item_brand: "Google",
          item_category: "Apparel",
          item_category2: "Adult",
          item_category3: "Shirts",
          item_category4: "Crew",
          item_category5: "Short sleeve",
          item_list_id: "related_products",
          item_list_name: "Related Products",
          item_variant: "green",
          location_id: "ChIJIQBpAG2ahYAR_6128GcTUEo",
          price: 9.99,
          quantity: 1
        },
        {
          item_id: "SKU_12346",
          item_name: "Google Grey Women's Tee",
          affiliation: "Google Merchandise Store",
          coupon: "SUMMER_FUN",
          discount: 3.33,
          index: 1,
          item_brand: "Google",
          item_category: "Apparel",
          item_category2: "Adult",
          item_category3: "Shirts",
          item_category4: "Crew",
          item_category5: "Short sleeve",
          item_list_id: "related_products",
          item_list_name: "Related Products",
          item_variant: "gray",
          location_id: "ChIJIQBpAG2ahYAR_6128GcTUEo",
          price: '20.99',
          promotion_id: "P_12345",
          promotion_name: "Summer Sale",
          quantity: 1
        }]
    }
  });


/* 
  Bad event failing validation:
  - value is required but missing - required
  - transaction_id should not be greater than 10 characters - maxLength
  - tax should a number - type
  - items.item_name is required but missing - required
  - items.price should not be less than 0 - minimum
  - items.quantity should not be less than 0 - minimum
*/
dataLayer.push({
  event: "purchase",
  ecommerce: {
      transaction_id: "T_1234567891011",
      tax: 'A123',
      shipping: 5.99,
      currency: "USD",
      coupon: "SUMMER_SALE",
      items: [
       {
        item_id: "SKU_12345",
        affiliation: "Google Merchandise Store",
        coupon: "SUMMER_FUN",
        discount: 2.22,
        index: 0,
        item_brand: "Google",
        item_category: "Apparel",
        item_category2: "Adult",
        item_category3: "Shirts",
        item_category4: "Crew",
        item_category5: "Short sleeve",
        item_list_id: "related_products",
        item_list_name: "Related Products",
        item_variant: "green",
        location_id: "ChIJIQBpAG2ahYAR_6128GcTUEo",
        price: -1,
        quantity: 1
      },
      {
        item_id: "SKU_12346",
        item_name: "Google Grey Women's Tee",
        affiliation: "Google Merchandise Store",
        coupon: "SUMMER_FUN",
        discount: 3.33,
        index: 1,
        item_brand: "Google",
        item_category: "Apparel",
        item_category2: "Adult",
        item_category3: "Shirts",
        item_category4: "Crew",
        item_category5: "Short sleeve",
        item_list_id: "related_products",
        item_list_name: "Related Products",
        item_variant: "gray",
        location_id: "ChIJIQBpAG2ahYAR_6128GcTUEo",
        price: '20.99',
        promotion_id: "P_12345",
        promotion_name: "Summer Sale",
        quantity: -2
      }]
  }
});