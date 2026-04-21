const sendMessage = async (message) => {
  try {
    console.log("Sending message to backend:", message);
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId: currentSessionId,
        userId: currentUserId
      })
    });
    
    if (!response.ok) {
      console.error("Error response from server:", response.status, response.statusText);
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Log the full response for debugging
    console.log("Full chat response from backend:", JSON.stringify(data, null, 2));
    
    // Additional specific logs for key parts
    console.log("Bot response:", data.botResponse);
    console.log("Conversation state:", data.conversationState);
    console.log("Grocery list items:", data.groceryList?.items?.length || 0);
    
    // Continue with your normal handling
    // ...
    
    return data;
  } catch (error) {
    console.error("Error in sendMessage:", error);
    // Handle error appropriately
  }
} 