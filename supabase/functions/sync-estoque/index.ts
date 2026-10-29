import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

serve(async (req) => {
  try {
    // 1. Liga à tua base de dados usando as chaves de segurança ocultas do servidor
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 2. Vai buscar os dados ao vivo ao site do distribuidor
    const response = await fetch("https://blending-wines-turista.vercel.app/lista.json")
    const dados = await response.json()

    let verificados = 0

    // 3. Percorre cada bodega e cada vinho
    for (const bodega of dados.bodegas) {
      for (const vinho of bodega.vinos) {
        const nomeDoVinho = vinho.rotulo
        
        // 4. Regras de Inteligência: Está disponível?
        let emEstoque = true
        if (vinho.agotado === true) emEstoque = false
        if (vinho.max === 0) emEstoque = false
        if (vinho.botella === null || vinho.botella === 0) emEstoque = false

        // 5. Envia a ordem de atualização para a tua tabela 'vinhos'
        await supabase
          .from('vinhos')
          .update({ ativo: emEstoque })
          .eq('nome', nomeDoVinho)

        verificados++
      }
    }

    // 6. Devolve uma mensagem de sucesso
    return new Response(
      JSON.stringify({ 
        sucesso: true, 
        mensagem: `A Mágica aconteceu! ${verificados} vinhos foram verificados e sincronizados.` 
      }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ sucesso: false, erro: (error as Error).message }),
      { headers: { "Content-Type": "application/json" }, status: 500 },
    )
  }
})