package com.bascavarat.store;

import android.os.Bundle;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.squareup.picasso.Picasso;

public class ProductDetailsActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_product_details);

        ImageView image = findViewById(R.id.detailImage);
        TextView brand = findViewById(R.id.detailBrand);
        TextView name = findViewById(R.id.detailName);
        TextView price = findViewById(R.id.detailPrice);
        TextView description = findViewById(R.id.detailDescription);
        Button addToCart = findViewById(R.id.addToCartButton);

        String productName = getIntent().getStringExtra("name");
        String productBrand = getIntent().getStringExtra("brand");
        String productDescription = getIntent().getStringExtra("description");
        String productImage = getIntent().getStringExtra("image");
        double productPrice = getIntent().getDoubleExtra("price", 0);

        name.setText(productName);
        brand.setText(productBrand);
        description.setText(productDescription);
        price.setText("$" + productPrice);

        if (productImage != null && !productImage.isEmpty()) {
            Picasso.get().load(productImage).into(image);
        }

        addToCart.setOnClickListener(v -> {
            Toast.makeText(this, "Added to Cart", Toast.LENGTH_SHORT).show();
            // Implement Cart logic here
        });
    }
}
