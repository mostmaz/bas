package com.bascavarat.store.api;

import com.bascavarat.store.models.Product;
import java.util.List;
import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Query;

public interface SupabaseService {
    @GET("rest/v1/products")
    Call<List<Product>> getProducts(@Query("select") String select);
}
