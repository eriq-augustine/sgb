function error(message) {
   console.log((new Error(message)).stack);

   // TEST
   stopRenderer();
}
