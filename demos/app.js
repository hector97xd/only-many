var app = new Vue({
    el: '#app',
    data: {
      message: 'Hello Vue!',
      estado : true
    },
    methods:{
        ocultar: ()=>{
            this.estado = false;
        }
    }
  })